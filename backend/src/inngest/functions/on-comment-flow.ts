// src/inngest/commentWorkflow.inngest.ts
import { prisma } from "../../db/index";
import { inngest } from "../client";
import axios from "axios";

// 1. Fetch from Model 1 every minute and save 3 comments as RAW
export const commentFetchScheduler = inngest.createFunction(
  { id: "comment-fetch-scheduler" },
  { cron: "*/60 * * * *" },
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

// 2. Process RAW comments: send to Model 2, update DB as ANALYZED
export const processRawComments = inngest.createFunction(
  { id: "process-raw-comments" },
  { cron: "*/60 * * * *" },
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
            { comment: comment.rawComment },
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
