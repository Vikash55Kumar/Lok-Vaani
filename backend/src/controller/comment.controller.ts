import { Parser } from 'json2csv';
import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../db/index';
import { logSecurityEvent } from '../utility/auditLogger';

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
        rawComment: true,
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

export {
  getCommentsByPostId,
  getCommentById,
  getCommonComments,
  getCommentCounts,
  getCategorizedCommentCounts,
  getCommentsWeightage,
  verifyCompanyComment,
  getAllCommentsWithSentiment,
  getAllCommentsWithSentimentCSV
};