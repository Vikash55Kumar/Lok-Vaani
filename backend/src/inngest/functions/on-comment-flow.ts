// src/inngest/commentWorkflow.inngest.ts
import { prisma } from "../../db/index";
import { ApiError } from "../../utility/ApiError";
import { inngest } from "../client";
import axios from "axios";
import { createCompanyInternal } from "../../controller/company.controller";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";
import { Storage } from "@google-cloud/storage";

// 1. Fetch from Model 1 every minute and save 3 comments as RAW
export const commentFetchScheduler = inngest.createFunction(
  { id: "comment-fetch-scheduler" },
  { cron: "*/1 * * * *" },
  async ({ step }) => {
    const commentsToGenerate = 3;
    const maxAttemptsPerComment = 3;
    
    let successfulComments = 0;
    const errors: any[] = [];
    const createdComments: any[] = [];

    for (let commentIndex = 0; commentIndex < commentsToGenerate; commentIndex++) {
      let stepData: any; // This will hold the JSON data from the API
      let attempts = 0;
      let commentSuccessful = false;

      // Try to fetch one comment with retry logic
      while (attempts < maxAttemptsPerComment && !commentSuccessful) {
        try {
          // ✅ FIXED: We extract only 'data' inside the step
          stepData = await step.run(
            `fetch-model1-comment-${commentIndex + 1}-attempt-${attempts + 1}`,
            async () => {
              // console.log(`➡️ Calling MODEL1 generate (Index: ${commentIndex + 1}, Attempt: ${attempts + 1})`);
              
              const response = await axios.post(
                `${process.env.MODEL1_API_URL}/generate`,
                {}, 
                { timeout: 15000 }
              );
              
              // ONLY return the serializable data payload
              return response.data; 
            }
          );

          // Check success based on the returned data payload
          if (stepData?.success) {
            commentSuccessful = true;
            break;
          }
          
        } catch (err) {
          console.error(
            `Error fetching comment ${commentIndex + 1}, attempt ${attempts + 1}:`,
            err
          );
          // We do not push to errors array here yet, we wait until all attempts fail
        }

        attempts++;
      }

      // If we got a successful response, save it to database
      // Note: stepData is now the direct data object, not response.data
      if (commentSuccessful && stepData?.success) {
        try {
          // Wrap DB write in a step to ensure idempotency if the function crashes here
          const newComment = await step.run(
            `save-comment-${commentIndex + 1}-db`, 
            async () => {
              return await prisma.comment.create({
                data: {
                  postId: stepData.postId,
                  postTitle: stepData.postTitle,
                  companyId: stepData.companyId,
                  businessCategoryId: stepData.businessCategoryId,
                  stakeholderName: stepData.companyName,
                  rawComment: stepData.comment,
                  commentType: stepData.commentType,
                  wordCount: stepData.wordCount,
                  status: "RAW"
                }
              });
            }
          );

          if (newComment) {
            successfulComments++;
            createdComments.push({ commentId: newComment.id, commentIndex: commentIndex + 1 });
          } 
        } catch (err) {
          console.error(`Error saving comment ${commentIndex + 1} to database:`, err);
          errors.push({ 
            commentIndex: commentIndex + 1, 
            error: `Database save failed: ${(err as any)?.message || err}` 
          });
        }
      } else {
        errors.push({ 
          commentIndex: commentIndex + 1, 
          error: "Failed to fetch comment after all attempts" 
        });
      }
    }

    if (successfulComments === 0) {
      return {
        message: "No RAW comments fetched",
        successfulComments,
        totalAttempted: commentsToGenerate,
        errors,
      };
    }

    return {
      status: "raw",
      successfulComments,
      totalAttempted: commentsToGenerate,
      createdComments,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
);

export const manualCommentFetch = inngest.createFunction(
  { id: "manual-comment-fetch" },
  { event: "app/manual.comment" },
  async ({ event, step }) => {
    const { 
      postId, 
      postTitle, 
      companyId: inputCompanyId, 
      businessCategoryId, 
      companyName, 
      comment, 
      commentType, 
      wordCount,
      state,
      hasFile,
      filePath,
      fileName,
      fileMimeType
    } = event.data;

    let finalCompanyId = inputCompanyId;
    let finalCompanyName = companyName;

    // Step 1: Create company if not provided
    if (!finalCompanyId) {
      const newCompany = await step.run("create-company", async () => {
        console.log(`Creating company: ${companyName} in category: ${businessCategoryId}`);
        return await createCompanyInternal({
          name: companyName,
          businessCategoryId,
          uniNumber: `USER_${Date.now()}`,
          state: state || "Unknown"
        });
      });

      if (!newCompany) {
        throw new Error("Failed to create company");
      }

      finalCompanyId = newCompany.id;
      finalCompanyName = newCompany.name;
      console.log(`Company created/found: ${finalCompanyName} (${finalCompanyId})`);
    }

    // Step 2: Extract text from document using IMAGE_API (only if file provided)
    const extractedText = await step.run("extract-document-text", async () => {
      // If no file, use the text comment directly
      if (!hasFile) {
        console.log("No file provided, using text comment directly");
        return {
          extractedText: comment || "",
          gcsBucketPath: null
        };
      }

      console.log(`Extracting text from document: ${fileName}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create FormData and append file
      const formData = new FormData();
      const fileStream = fs.createReadStream(filePath);
      formData.append("file", fileStream, fileName);

      // Call IMAGE_API for OCR
      const IMAGE_API_URL = process.env.IMAGE_API_URL || process.env.AI_MODEL_URL;
      if (!IMAGE_API_URL) {
        throw new Error("IMAGE_API_URL or AI_MODEL_URL not configured");
      }

      try {
        const response = await axios.post(
          `${IMAGE_API_URL}/uploads`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 60000 // 60 second timeout
          }
        );

        console.log("IMAGE_API Response:", JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.extracted_text) {
          throw new Error("No text extracted from document");
        }

        // Normalize extracted text: collapse whitespace and trim
        const rawExtracted = String(response.data.extracted_text || "");
        const plainText = rawExtracted.replace(/\s+/g, " ").trim();

        if (plainText.length <= 20) {
          throw new Error("Extracted text too short (< 20 characters)");
        }

        console.log(`Extracted ${plainText.length} characters from document`);
        console.log(`GCS file_path from IMAGE_API: ${response.data.file_path || "NOT PROVIDED"}`);
        
        return {
          extractedText: plainText,
          gcsBucketPath: response.data.file_path || null
        };
      } catch (error: any) {
        console.error("Error extracting text:", error.message);
        throw new Error(`Text extraction failed: ${error.message}`);
      }
    });

    // Step 3: Upload file directly to GCS (only if file provided)
    const gcsFilePath = await step.run("upload-to-gcs", async () => {
      // Skip upload if no file
      if (!hasFile) {
        console.log("No file to upload, skipping GCS upload");
        return null;
      }

      const GCS_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
      const GCS_KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const GCS_CREDENTIALS_JSON = process.env.GOOGLE_CREDENTIALS_JSON;
      
      if (!GCS_BUCKET_NAME) {
        console.error("STORAGE_BUCKET_NAME not configured");
        return null;
      }

      try {
        // Initialize GCS client with credentials
        const storageOptions: any = {};
        
        // Priority 1: Use credentials from Secret Manager (JSON string)
        if (GCS_CREDENTIALS_JSON) {
          try {
            const credentials = JSON.parse(GCS_CREDENTIALS_JSON);
            storageOptions.credentials = credentials;
            console.log("Using GCS credentials from GOOGLE_CREDENTIALS_JSON (Secret Manager)");
          } catch (parseError) {
            console.error("Failed to parse GOOGLE_CREDENTIALS_JSON:", parseError);
          }
        }
        // Priority 2: Use local key file (for development)
        else if (GCS_KEY_FILE && fs.existsSync(GCS_KEY_FILE)) {
          storageOptions.keyFilename = GCS_KEY_FILE;
          console.log(`Using GCS credentials from file: ${GCS_KEY_FILE}`);
        }
        // Priority 3: Use Application Default Credentials
        else {
          console.log("Using default GCS credentials (Application Default Credentials)");
        }
        
        const storage = new Storage(storageOptions);
        const bucket = storage.bucket(GCS_BUCKET_NAME);
        
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const gcsFileName = `manual-comments/${timestamp}-${sanitizedFileName}`;
        
        // Upload file with public access
        await bucket.upload(filePath, {
          destination: gcsFileName,
          metadata: {
            contentType: fileMimeType,
          },
        });
        
        console.log(`File uploaded to GCS: ${gcsFileName}`);
        return gcsFileName;
      } catch (error: any) {
        console.error("GCS upload failed:", error.message || error);
        // If upload fails, we'll return null and docUrl will be null
        return null;
      }
    });

    // Step 4: Build document URL from GCS path
    const docUrl = await step.run("build-document-url", async () => {
      const GCS_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
      
      if (!gcsFilePath || !GCS_BUCKET_NAME) {
        console.error("Cannot build GCS URL - missing bucket name or file path");
        return null;
      }

      const url = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${gcsFilePath}`;
      console.log(`Document URL: ${url}`);
      return url;
    });

    // Step 5: Save comment to database
    const newComment = await step.run("save-comment-to-database", async () => {
      console.log(`Saving comment to database for post: ${postId}`);
      
      return await prisma.comment.create({
        data: {
          postId,
          postTitle,
          companyId: finalCompanyId,
          businessCategoryId,
          stakeholderName: finalCompanyName,
          rawComment: extractedText.extractedText, // Store extracted text as raw comment
          commentType,
          wordCount: extractedText.extractedText.split(/\s+/).length,
          status: "RAW",
          docUrl
        }
      });
    });

    if (!newComment) {
      throw new Error("Failed to save comment to database");
    }

    console.log(`Comment saved successfully: ${newComment.id}`);

    // Step 6: Cleanup - delete local file (only if file was uploaded)
    await step.run("cleanup-local-file", async () => {
      if (!hasFile || !filePath) {
        console.log("No file to cleanup");
        return;
      }

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up local file: ${filePath}`);
        }
      } catch (error: any) {
        console.warn(`Failed to cleanup file ${filePath}:`, error.message);
        // Don't throw - cleanup failure is not critical
      }
    });

    return {
      success: true,
      data: {
        commentId: newComment.id,
        postId: newComment.postId,
        postTitle: newComment.postTitle,
        companyId: newComment.companyId,
        businessCategoryId: newComment.businessCategoryId,
        stakeholderName: newComment.stakeholderName,
        rawComment: newComment.rawComment,
        commentType: newComment.commentType,
        wordCount: newComment.wordCount,
        status: newComment.status,
        docUrl: newComment.docUrl,
        extractedTextLength: extractedText.extractedText.length,
        createdAt: newComment.createdAt
      }
    };
  }
);

// 2. Process RAW comments: send to Model 2, update DB as ANALYZED
export const processRawComments = inngest.createFunction(
  { id: "process-raw-comments" },
  { cron: "*/1 * * * *" },
  async ({ step }) => {
    const maxCommentsPerRun = 3;
    let processedCount = 0;
    let lastProcessedCommentId = null;
    let anyProcessed = false;
    let errors: any[] = [];

    for (let i = 0; i < maxCommentsPerRun; i++) {
      // 1. Find eligible comment (Wrapped in step)
      const comment = await step.run(`find-raw-comment-${i + 1}`, async () => {
        return await prisma.comment.findFirst({
          where: {
            status: "RAW",
            processingAttempts: { lt: 3 }
          }
        });
      });

      if (!comment) {
        if (i === 0) {
          return { message: "No eligible comments found", status: "Skipped" };
        }
        break; // Stop loop if no more comments
      }

      let analysisResult: any; // Will hold the plain JSON data

      // 2. Call Model 2
      try {
        analysisResult = await step.run(`call-model2-attempt-${comment.id}-1`, async () => {
          const response = await axios.post(
            `${process.env.MODEL2_API_URL}/analyze`,
            { comment: comment.rawComment,
              commentType: comment.commentType,
             },
            { timeout: 60000 }
          );
          // ✅ FIX: Only return the data payload
          return response.data; 
        });

      } catch (err) {
        // --- Error Handling Logic ---
        let errorInfo: any = { step: `call-model2-attempt-${comment.id}-1` };
        const axiosErr = err as any;
        
        // Extract serializable error info
        if (axiosErr && axiosErr.isAxiosError) {
          errorInfo.error = axiosErr.message;
          errorInfo.code = axiosErr.code;
          if (axiosErr.code === 'ECONNABORTED') errorInfo.type = 'timeout';
        } else {
          errorInfo.error = (err as any)?.message || err;
        }

        console.error(`Error calling Model 2 (comment ${comment.id}):`, errorInfo);
        errors.push(errorInfo);

        // Update attempts in DB (Wrapped in step)
        await step.run(`increment-attempts-${comment.id}`, async () => {
           await prisma.comment.update({
            where: { id: comment.id },
            data: { processingAttempts: (comment.processingAttempts || 0) + 1 }
          });
        });
        continue; // Skip to next comment
      }

      // 3. Check Logical Success (using analysisResult directly)
      if (!analysisResult?.success) {
        const errorMsg = analysisResult?.error || "Unknown API error";
        
        await step.run(`mark-failed-${comment.id}`, async () => {
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              status: "FAILED",
              processingError: errorMsg
            }
          });
        });
        continue;
      }

      // 4. Success - Update DB as ANALYZED (Wrapped in step)
      try {
        await step.run(`update-analyzed-${comment.id}`, async () => {
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              // Note: analysisResult IS the data now, so we don't need .data.translated
              standardComment: analysisResult.translated,
              language: analysisResult.language_type,
              sentiment: analysisResult.sentiment,
              sentimentScore: analysisResult.sentimentScore,
              summary: analysisResult.summary,
              status: "ANALYZED",
              processedAt: new Date(),
              processingError: null
            }
          });
        });

        processedCount++;
        lastProcessedCommentId = comment.id;
        anyProcessed = true;

      } catch (err) {
        console.error(`Error updating comment as ANALYZED (comment ${comment.id}):`, err);
        errors.push({ step: `update-analyzed-${comment.id}`, error: (err as any)?.message });
      }
    }

    return {
      status: anyProcessed ? "analyzed" : "completed_with_errors",
      processedCount,
      lastProcessedCommentId,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
);

// Health check function to monitor system status
export const systemHealthCheck = inngest.createFunction(
  { id: "system-health-check" },
  { cron:  "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    await step.run("check-system-health", async () => {
      try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;
        
        // Check recent comment processing
        const recentComments = await prisma.comment.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          }
        });

        // Check processing queue status
        const pendingComments = await prisma.comment.count({
          where: { status: "PROCESSING" }
        });

        const failedComments = await prisma.comment.count({
          where: { status: "FAILED" }
        });

        console.log("💚 System Health Check:", {
          recentComments,
          pendingComments,
          failedComments,
          timestamp: new Date().toISOString()
        });

        // Alert if too many failures or pending items
        if (failedComments > 10 || pendingComments > 20) {
          console.warn("⚠️  System health warning:", {
            failedComments,
            pendingComments
          });
        }

        return {
          healthy: true,
          metrics: { recentComments, pendingComments, failedComments }
        };
      } catch (error: any) {
        console.error("❌ System health check failed:", error.message);
        return { healthy: false, error: error.message };
      }
    });
  }
);
