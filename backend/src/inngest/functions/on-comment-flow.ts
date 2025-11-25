// src/inngest/commentWorkflow.inngest.ts
import { prisma } from "../../db/index";
import ApiResponse from "../../utility/ApiResponse";
import { inngest } from "../client";
import axios from "axios";

// 1. Fetch from Model 1 every minute and save 3 comments as RAW
export const commentFetchScheduler = inngest.createFunction(
  { id: "comment-fetch-scheduler" },
  { cron:  "*/1 * * * *"}, // Every 60 minute
  async ({ step }) => {
    const commentsToGenerate = 3;
    const maxAttemptsPerComment = 3;
    let successfulComments = 0;
    let errors: any[] = [];
    const createdComments: any[] = [];

    for (let commentIndex = 0; commentIndex < commentsToGenerate; commentIndex++) {
      let response;
      let attempts = 0;
      let commentSuccessful = false;

      // Try to fetch one comment with retry logic
      while (attempts < maxAttemptsPerComment && !commentSuccessful) {
        try {
          response = await step.run(`fetch-model1-comment-${commentIndex + 1}-attempt-${attempts + 1}`, async () => {
            return await axios.post(`${process.env.MODEL1_API_URL}/generate`, { timeout: 15000 });
          });

          if (response?.data?.success) {
            commentSuccessful = true;
            break;
          }
        } catch (err) {
          console.error(`Error fetching comment ${commentIndex + 1}, attempt ${attempts + 1}:`, err);
          errors.push({ 
            commentIndex: commentIndex + 1, 
            attempt: attempts + 1, 
            error: (err as any)?.message || err 
          });
        }
        attempts++;
      }

      // If we got a successful response, save it to database
      if (commentSuccessful && response?.data?.success) {
        try {
          const data = response.data;
          const newComment = await prisma.comment.create({
            data: {
              postId: data.postId,
              postTitle: data.postTitle,
              companyId: data.companyId,
              businessCategoryId: data.businessCategoryId,
              stakeholderName: data.companyName,
              rawComment: data.comment,
              wordCount: data.wordCount,
              status: "RAW"
            }
          });

          if (newComment) {
            successfulComments++;
            createdComments.push({ commentId: newComment.id, commentIndex: commentIndex + 1 });
          } else {
            errors.push({ 
              commentIndex: commentIndex + 1, 
              error: "Failed to save comment to database" 
            });
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
      return new ApiResponse(200, { 
        message: "No RAW comments fetched", 
        errors 
      }, "Skipped - All attempts failed");
    }

    return new ApiResponse(200, { 
      status: "raw", 
      successfulComments, 
      totalAttempted: commentsToGenerate,
      createdComments,
      errors: errors.length > 0 ? errors : undefined
    }, `${successfulComments}/${commentsToGenerate} comments fetched and saved as RAW`);
  }
);

// 2. Process RAW comments: send to Model 2, update DB as ANALYZED
export const processRawComments = inngest.createFunction(
  { id: "process-raw-comments" },
  { cron:  "*/1 * * * *" },
  async ({ step }) => {
    // Process up to 3 eligible RAW comments per run
    const maxCommentsPerRun = 3;
    let processedCount = 0;
    let lastProcessedCommentId = null;
    let anyProcessed = false;
    let errors: any[] = [];

    for (let i = 0; i < maxCommentsPerRun; i++) {
      let comment;
      try {
        // Find next eligible comment
        comment = await step.run(`find-raw-comment-${i+1}`, async () => {
          return await prisma.comment.findFirst({
            where: {
              status: "RAW",
              processingAttempts: { lt: 3 }
            }
          });
        });
      } catch (err) {
        console.error(`Error finding raw comment (iteration ${i+1}):`, err);
        errors.push({ step: `find-raw-comment-${i+1}`, error: err || err });
        continue;
      }
      if (!comment) {
        if (i === 0) {
          return new ApiResponse(200, "No eligible comments", "Skipped");
        }
        break;
      }

      // Only one call to Model 2 per comment, 60s timeout
      let model2Response;
      try {
        model2Response = await step.run(`call-model2-attempt-${comment.id}-1`, async () => {
          return await axios.post(`${process.env.MODEL2_API_URL}/analyze`, {
            comment: comment.rawComment
          }, { timeout: 60000 });
        });
      } catch (err) {
        // Enhanced Axios error handling with type assertions
        let errorInfo: any = { step: `call-model2-attempt-${comment.id}-1` };
        const axiosErr = err as any;
        if (axiosErr && axiosErr.isAxiosError) {
          errorInfo.error = axiosErr.message;
          errorInfo.code = axiosErr.code;
          errorInfo.axiosConfig = {
            url: axiosErr.config?.url,
            method: axiosErr.config?.method,
            timeout: axiosErr.config?.timeout
          };
          if (axiosErr.code === 'ECONNABORTED') {
            errorInfo.type = 'timeout';
          }
          if (axiosErr.response) {
            errorInfo.status = axiosErr.response.status;
            errorInfo.statusText = axiosErr.response.statusText;
            errorInfo.data = axiosErr.response.data;
          }
        } else {
          errorInfo.error = (err as any)?.message || err;
        }
        console.error(`Error calling Model 2 (comment ${comment.id}, attempt 1):`, errorInfo);
        errors.push(errorInfo);
        // Increment processingAttempts after failed attempt
        try {
          await prisma.comment.update({
            where: { id: comment.id },
            data: { processingAttempts: comment.processingAttempts + 1 }
          });
        } catch (err) {
          console.error(`Error updating processingAttempts (comment ${comment.id}):`, err);
          errors.push({ step: `update-processingAttempts-${comment.id}`, error: (err as any)?.message || err });
        }
        continue; // Move to next comment
      }

      // If Model 2 failed (no .data.success), mark as FAILED
      if (!model2Response?.data?.success) {
        const error = model2Response?.data?.error || model2Response?.statusText || "Unknown error";
        try {
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              status: "FAILED",
              processingError: error
            }
          });
        } catch (err) {
          console.error(`Error marking comment as FAILED (comment ${comment.id}):`, err);
          errors.push({ step: `mark-failed-${comment.id}`, error: (err as any)?.message || err });
        }
        continue; // Move to next comment
      }

      // If successful, update as ANALYZED
      try {
        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            standardComment: model2Response?.data?.translated,
            language: model2Response?.data?.language_type,
            sentiment: model2Response?.data?.sentiment,
            sentimentScore: model2Response?.data?.sentimentScore,
            summary: model2Response?.data?.summary,
            status: "ANALYZED",
            processedAt: new Date(),
            processingError: null
          }
        });
        processedCount++;
        lastProcessedCommentId = comment.id;
        anyProcessed = true;
      } catch (err) {
        console.error(`Error updating comment as ANALYZED (comment ${comment.id}):`, err);
        errors.push({ step: `update-analyzed-${comment.id}`, error: (err as any)?.message || err });
      }
    }

    if (anyProcessed) {
      return new ApiResponse(200, { status: "analyzed", processedCount, lastProcessedCommentId, errors }, "Comments processed and updated");
    } else {
      return new ApiResponse(200, { message: "No eligible comments", errors }, "Skipped");
    }
  }
);

// Health check function to monitor system status
export const systemHealthCheck = inngest.createFunction(
  { id: "system-health-check" },
  { cron:  "*/60 * * * *" }, // Every 5 minutes
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
