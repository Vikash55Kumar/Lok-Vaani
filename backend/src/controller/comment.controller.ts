import { Parser } from 'json2csv';
import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../db/index';
import { logSecurityEvent } from '../utility/auditLogger';
import { inngest } from '../inngest/client';
import * as path from 'path';


// Get comments by post ID
const getCommentsByPostId = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { postId, status: 'ANALYZED' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        company: {
          select: {
            name: true,
            state: true,
            businessCategory: {
              select: {
                name: true,
                weightageScore: true,
                categoryType: true
              }
            }
          }
        },
        rawComment: true,
        summary: true,
        sentiment: true,
        language: true,
        commentType: true,
        docUrl: true,
        keywords: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw new ApiError(500, "Failed to fetch comments");
  }
});

// Get Total no of comments in Total, Positive, Negative, Neutral categories
const getCommentCounts = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    const totalComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED' }
    });

    const positiveComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', sentiment: 'Positive' }
    });

    const negativeComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', sentiment: 'Negative' }
    });

    const neutralComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', sentiment: 'Neutral' }
    });

    res.status(200).json(new ApiResponse(200, {
      total: totalComments,
      positive: positiveComments,
      negative: negativeComments,
      neutral: neutralComments
    }, "Comment counts fetched successfully"));
  } catch (error) {
    console.error("Error fetching comment counts:", error);
    throw new ApiError(500, "Failed to fetch comment counts");
  }
});

// Get Total no of comments in Total, Positive, Negative, Neutral categories
const getCategorizedCommentCounts = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    // Bussiness
    const businessPositiveComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', businessCategory: {
        categoryType: 'BUSINESS'
      }  , sentiment: 'Positive' }
    });

    const businessNegativeComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', businessCategory: {
        categoryType: 'BUSINESS'
      }  , sentiment: 'Negative' }
    });

    const businessNeutralComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', businessCategory: {
        categoryType: 'BUSINESS'
      }  , sentiment: 'Neutral' }
    });

    // User
    const userPositiveComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', businessCategory: {
        categoryType: 'USER'
      }  , sentiment: 'Positive' }
    });

    const userNegativeComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', businessCategory: {
        categoryType: 'USER'
      }  ,  sentiment: 'Negative' }
    });

    const userNeutralComments = await prisma.comment.count({
      where: { postId, status: 'ANALYZED', businessCategory: {
        categoryType: 'USER'
      }  , sentiment: 'Neutral' }
    });

    res.status(200).json(new ApiResponse(200, {
      user: {
        positive: userPositiveComments,
        negative: userNegativeComments,
        neutral: userNeutralComments
      },
      business: {
        positive: businessPositiveComments,
        negative: businessNegativeComments,
        neutral: businessNeutralComments
      },
    }, "Category Comment counts fetched successfully"));
  } catch (error) {
    console.error("Error fetching comment counts:", error);
    throw new ApiError(500, "Failed to fetch comment counts");
  }
});

// Get Positive , Negative, Netural percentage according all waitage of comments 
const getCommentsWeightage = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    // Get all analyzed comments with their weightage scores
    const comments = await prisma.comment.findMany({
      where: { 
        postId, 
        status: 'ANALYZED',
        sentiment: {
          in: ['Positive', 'Negative', 'Neutral']
        }
      },
      select: {
        id: true,
        sentiment: true,
        company: {
          select: {
            businessCategory: {
              select: {
                weightageScore: true,
                name: true,
                categoryType: true
              }
            }
          }
        }
      }
    });

    if (comments.length === 0) {
      return res.status(200).json(new ApiResponse(200, {
        totalWeightedComments: 0,
        weightedPercentages: {
          positive: 0,
          negative: 0,
          neutral: 0
        },
        categoryBreakdown: {
          user: { positive: 0, negative: 0, neutral: 0, totalWeight: 0 },
          business: { positive: 0, negative: 0, neutral: 0, totalWeight: 0 }
        }
      }, "No analyzed comments found"));
    }

    // Calculate weighted scores for each sentiment
    let positiveWeight = 0;
    let negativeWeight = 0;
    let neutralWeight = 0;
    let totalWeight = 0;

    // Category-wise breakdown
    const userWeights = { positive: 0, negative: 0, neutral: 0, total: 0 };
    const businessWeights = { positive: 0, negative: 0, neutral: 0, total: 0 };

    comments.forEach(comment => {
      const weightageScore = comment.company?.businessCategory?.weightageScore || 1;
      const categoryType = comment.company?.businessCategory?.categoryType;
      
      totalWeight += weightageScore;

      // Calculate overall weighted sentiment
      switch (comment.sentiment) {
        case 'Positive':
          positiveWeight += weightageScore;
          break;
        case 'Negative':
          negativeWeight += weightageScore;
          break;
        case 'Neutral':
          neutralWeight += weightageScore;
          break;
      }

      // Calculate category-wise weighted sentiment
      if (categoryType === 'USER') {
        userWeights.total += weightageScore;
        switch (comment.sentiment) {
          case 'Positive':
            userWeights.positive += weightageScore;
            break;
          case 'Negative':
            userWeights.negative += weightageScore;
            break;
          case 'Neutral':
            userWeights.neutral += weightageScore;
            break;
        }
      } else if (categoryType === 'BUSINESS') {
        businessWeights.total += weightageScore;
        switch (comment.sentiment) {
          case 'Positive':
            businessWeights.positive += weightageScore;
            break;
          case 'Negative':
            businessWeights.negative += weightageScore;
            break;
          case 'Neutral':
            businessWeights.neutral += weightageScore;
            break;
        }
      }
    });

    // Calculate weighted percentages
    const weightedPercentages = {
      positive: totalWeight > 0 ? Math.round((positiveWeight / totalWeight) * 100 * 100) / 100 : 0,
      negative: totalWeight > 0 ? Math.round((negativeWeight / totalWeight) * 100 * 100) / 100 : 0,
      neutral: totalWeight > 0 ? Math.round((neutralWeight / totalWeight) * 100 * 100) / 100 : 0
    };

    // Calculate category-wise percentages
    const categoryBreakdown = {
      user: {
        positive: userWeights.total > 0 ? Math.round((userWeights.positive / userWeights.total) * 100 * 100) / 100 : 0,
        negative: userWeights.total > 0 ? Math.round((userWeights.negative / userWeights.total) * 100 * 100) / 100 : 0,
        neutral: userWeights.total > 0 ? Math.round((userWeights.neutral / userWeights.total) * 100 * 100) / 100 : 0,
        totalWeight: Math.round(userWeights.total * 100) / 100
      },
      business: {
        positive: businessWeights.total > 0 ? Math.round((businessWeights.positive / businessWeights.total) * 100 * 100) / 100 : 0,
        negative: businessWeights.total > 0 ? Math.round((businessWeights.negative / businessWeights.total) * 100 * 100) / 100 : 0,
        neutral: businessWeights.total > 0 ? Math.round((businessWeights.neutral / businessWeights.total) * 100 * 100) / 100 : 0,
        totalWeight: Math.round(businessWeights.total * 100) / 100
      }
    };

    const responseData = {
      totalAnalyzedComments: comments.length,
      totalWeightedScore: Math.round(totalWeight * 100) / 100,
      weightedPercentages,
      categoryBreakdown,
      rawWeights: {
        positive: Math.round(positiveWeight * 100) / 100,
        negative: Math.round(negativeWeight * 100) / 100,
        neutral: Math.round(neutralWeight * 100) / 100
      }
    };

    res.status(200).json(new ApiResponse(200, responseData, "Comments weightage analysis fetched successfully"));
  } catch (error) {
    console.error("Error fetching comments weightage:", error);
    throw new ApiError(500, "Failed to fetch comments weightage analysis");
  }
});

// Get comment by ID
const getCommentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Comment ID is required");
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      company: {
        select: {
          name: true,
          businessCategory: {
            select: {
              name: true,
              weightageScore: true
            }
          }
        }
      },
      rawComment: true,
      standardComment: true,
      summary: true,
      sentiment: true,
      keywords: true,
      status: true,
      createdAt: true
    }
  });

  if (!comment) {
    await logSecurityEvent('COMMENT_FETCH_FAILED', "while fetching comment", { id, reason: 'Comment not found' });
    throw new ApiError(404, "Comment not found");
  }

  res.status(200).json(new ApiResponse(200, comment, "Comment fetched successfully"));  
});

// Get common (repeated) comments by post ID
const getCommonComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    const groupedComments = await prisma.comment.groupBy({
      by: ['rawComment'],
      _count: { rawComment: true },
      where: { postId }
    });

    // Only keep comments that are repeated (count > 1)
    const commonComments = groupedComments.filter(c => c._count.rawComment > 1);

    res.status(200).json(new ApiResponse(200, commonComments, "Common comments fetched successfully"));
  } catch (error) {
    console.error("Error fetching common comments:", error);
    throw new ApiError(500, "Failed to fetch common comments");
  }
});

// Verify if a company already has a comment for a specific post
const verifyCompanyComment = asyncHandler(async (req: Request, res: Response) => {
  const { postId, companyId } = req.query;

  if (!postId || !companyId) {
    throw new ApiError(400, "Post ID and Company ID are required");
  }

  try {
    const existingComment = await prisma.comment.findFirst({
      where: {
        postId: postId as string,
        companyId: companyId as string
      },
      select: {
        id: true
      }
    });

    const hasComment = !!existingComment;
    console.log("comment verify hit");

    res.status(200).json(new ApiResponse(200, { 
      hasComment,
      postId,
      companyId 
    }, hasComment ? "Company already has a comment for this post" : "Company has no comment for this post"));
  } catch (error) {
    console.error("Error verifying company comment:", error);
    throw new ApiError(500, "Failed to verify company comment");
  }
});

const getAllCommentsWithSentimentCSV = asyncHandler(async (req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { status: 'ANALYZED' },
      select: {
        standardComment: true,
        sentiment: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    const fields = ['standardComment', 'sentiment'];
    const parser = new Parser({ fields });
    const csv = parser.parse(comments);

    res.header('Content-Type', 'text/csv');
    res.attachment('comments_with_sentiment.csv');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting comments as CSV:", error);
    throw new ApiError(500, "Failed to export comments as CSV");
  }
});

const getAllCommentsWithSentiment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { status: 'ANALYZED' },
      select: {
        standardComment: true,
        sentiment: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Optionally, format as CSV or tabular JSON for export
    res.status(200).json(new ApiResponse(200, comments, "All comments with sentiment fetched successfully"));
  } catch (error) {
    console.error("Error fetching all comments:", error);
    throw new ApiError(500, "Failed to fetch all comments");
  }
});

const getAllComments = asyncHandler(async (req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { status: 'ANALYZED' },
      select: {
        standardComment: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Return only the comment text, not the key
    const commentList = comments.map(c => c.standardComment);

    res.status(200).json(new ApiResponse(200, commentList, "All comments fetched successfully"));
  } catch (error) {
    console.error("Error fetching all comments:", error);
    throw new ApiError(500, "Failed to fetch all comments");
  }
});

// get top 5 negative comments with highest sentiment scores
const getTopNegativeCommentsNew = asyncHandler(async (req: Request, res: Response) => {
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";
  try {
    // First check what negative comments exist
    const allNegativeComments = await prisma.comment.findMany({
      where: {
        postId,
        status: 'ANALYZED',
        sentiment: 'Negative'
      },
      select: {
        id: true,
        sentiment: true,
        sentimentScore: true,
        standardComment: true,
      }
    });

    console.log('Total negative comments found:', allNegativeComments.length);
    console.log('Sample sentimentScores:', allNegativeComments.slice(0, 3).map(c => c.sentimentScore));

    // Get top 5 negative comments - if sentimentScore exists use it, otherwise sort by createdAt
    const topNegativeComments = await prisma.comment.findMany({
      where: {
        postId,
        status: 'ANALYZED',
        sentiment: 'Negative'
      },
      orderBy: [
        { sentimentScore: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5,
      select: {
        id: true,
        rawComment: true,
        summary: true,
        sentiment: true,
        sentimentScore: true,
        keywords: true,
        commentType: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            state: true,
            businessCategory: {
              select: {
                name: true,
                categoryType: true,
                weightageScore: true
              }
            }
          }
        }
      }
    });

    res.status(200).json(new ApiResponse(200, {
      count: topNegativeComments.length,
      totalNegative: allNegativeComments.length,
      comments: topNegativeComments
    }, "Top negative comments fetched successfully"));
  } catch (error) {
    console.error("Error fetching top negative comments:", error);
    throw new ApiError(500, "Failed to fetch top negative comments");
  }
});

// manualCommentFetch
const manualCommentFetchNew = asyncHandler(async (req, res) => {
  let { companyId, businessCategoryId, companyName, comment, commentType, state } = req.body;
  
  // User category ID (citizens/general users)
  const USER_CATEGORY_ID = "801e4fc0-9ea9-4980-811a-bb799c6da05e";
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";
  const postTitle = "Invitation for public comments on establishment of Indian Multi-Disciplinary Partnership (MDP) firms.";

  // Extract uploaded file (optional)
  const file = (req.files && (req.files as any)["file"] && (req.files as any)["file"][0]) || null;

  // Validate: Either file OR comment text is required
  if (!file && !comment) {
    throw new ApiError(400, "Either file upload or comment text is required");
  }

  // Set default values if not provided
  if (!companyId) {
    companyId = null; // Will be created in inngest
    businessCategoryId = USER_CATEGORY_ID;
  }

  try {
    // Send to inngest workflow with file metadata (if file provided)
    const result = await inngest.send({
      name: "app/manual.comment",
      data: {
        postId,
        postTitle,
        companyId,
        businessCategoryId,
        companyName: companyName || "Unknown User",
        comment: comment || "",
        commentType: commentType || "overall",
        wordCount: "",
        state: state || "Unknown",
        hasFile: !!file,
        filePath: file?.path || null,
        fileName: file?.originalname || null,
        fileMimeType: file?.mimetype || null,
        fileSize: file?.size || 0
      }
    });

    if (!result) {
      throw new ApiError(500, "Failed to submit comment to workflow");
    }

    // Wait for workflow to complete and save to database (max 60 seconds)
    let attempts = 0;
    const maxAttempts = 60; // Increased to 60 seconds to allow for GCS upload
    let savedComment = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      // Check if comment was saved WITH docUrl (look for most recent comment)
      savedComment = await prisma.comment.findFirst({
        where: {
          postId,
          createdAt: {
            gte: new Date(Date.now() - 120000) // Within last 2 minutes
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          postId: true,
          companyId: true,
          docUrl: true,
          status: true,
          rawComment: true,
          company: {
            select: {
              name: true
            }
          }
        }
      });

      // Only break if we have docUrl (meaning workflow completed all steps)
      if (savedComment && savedComment.docUrl) {
        console.log(`Found comment with docUrl after ${attempts + 1} attempts`);
        break;
      }
      
      attempts++;
    }

    if (!savedComment) {
      throw new ApiError(500, "Comment processing timeout - check Inngest dashboard");
    }

    if (!savedComment.docUrl) {
      console.warn("Comment saved but docUrl is missing - GCS upload may have failed");
    }

    res.status(200).json(new ApiResponse(200, {
      commentId: savedComment.id,
      docUrl: savedComment.docUrl,
      companyId: savedComment.companyId,
      companyName: savedComment.company?.name,
      comment: savedComment.rawComment,
      postId: savedComment.postId,
      status: savedComment.status,
      extractedTextLength: savedComment.rawComment?.length || 0
    }, "Comment saved successfully"));
  } catch (error: any) {
    console.error("Error submitting comment:", error);
    throw new ApiError(500, `Failed to submit comment: ${error.message}`);
  }
});

// Get clause-wise sentiment analysis
const getClauseWiseSentimentNew = asyncHandler(async (req: Request, res: Response) => {
  const postId= "a90315d4-b2b1-4836-a848-b47e318a5fa5"

  try {
    // Get all analyzed comments with their comment types (which represent clauses)
    const comments = await prisma.comment.findMany({
      where: { 
        postId, 
        status: 'ANALYZED',
        commentType: { not: null }
      },
      select: {
        commentType: true,
        sentiment: true,
      }
    });

    if (comments.length === 0) {
      return res.status(200).json(new ApiResponse(200, {
        clauses: [],
        message: "No analyzed comments found"
      }, "No analyzed comments found for this post"));
    }

    // Group comments by clause (commentType) and count sentiments
    const clauseMap = new Map<string, { positive: number; negative: number; neutral: number; total: number }>();

    comments.forEach(comment => {
      const clause = comment.commentType || 'overall';
      
      if (!clauseMap.has(clause)) {
        clauseMap.set(clause, { positive: 0, negative: 0, neutral: 0, total: 0 });
      }

      const clauseData = clauseMap.get(clause)!;
      clauseData.total++;

      switch (comment.sentiment?.toLowerCase()) {
        case 'positive':
          clauseData.positive++;
          break;
        case 'negative':
          clauseData.negative++;
          break;
        case 'neutral':
          clauseData.neutral++;
          break;
      }
    });

    // Convert map to array format
    const clausesAnalysis = Array.from(clauseMap.entries()).map(([clause, data]) => ({
      clause,
      positive: data.positive,
      negative: data.negative,
      neutral: data.neutral,
      total: data.total,
      positivePercentage: Math.round((data.positive / data.total) * 100 * 100) / 100,
      negativePercentage: Math.round((data.negative / data.total) * 100 * 100) / 100,
      neutralPercentage: Math.round((data.neutral / data.total) * 100 * 100) / 100
    }));

    // Sort by total comments (most discussed clauses first)
    clausesAnalysis.sort((a, b) => b.total - a.total);

    res.status(200).json(new ApiResponse(200, {
      postId,
      totalAnalyzedComments: comments.length,
      clauses: clausesAnalysis
    }, "Clause-wise sentiment analysis fetched successfully"));
  } catch (error) {
    console.error("Error fetching clause-wise sentiment:", error);
    throw new ApiError(500, "Failed to fetch clause-wise sentiment analysis");
  }
});

// Get all Hindi comments
const getAllHindiComments = asyncHandler(async (req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { 
        status: 'ANALYZED',
        language: 'Hindi' // Filter for Hindi comments
      },
      select: {
        rawComment: true,
      }
    });

    res.status(200).json(new ApiResponse(200, {
      totalHindiComments: comments.length,
      comments
    }, "Hindi comments fetched successfully"));
  } catch (error) {
    console.error("Error fetching Hindi comments:", error);
    throw new ApiError(500, "Failed to fetch Hindi comments");
  }
});

export {
  getCommentsByPostId,
  getCommentById,
  getCommonComments,
  getCommentCounts,
  getCategorizedCommentCounts,
  getCommentsWeightage,
  verifyCompanyComment,
  getAllCommentsWithSentiment,
  getAllCommentsWithSentimentCSV,
  getAllComments,
  manualCommentFetchNew,
  getClauseWiseSentimentNew,
  getTopNegativeCommentsNew,
  getAllHindiComments
};
