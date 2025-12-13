import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../db/index';
import axios from 'axios';

// Get timeline summaries for a post (with all category breakdowns)
export const getPostSummaries = asyncHandler(async (req: Request, res: Response) => {
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";
  console.log("Fetching summaries for postId:", postId);
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const summaries = await prisma.postSummary.findMany({
    where: { postId },
    include: {
      categorySummaries: {
        orderBy: { categoryName: 'asc' }
      }
    },
    orderBy: { generatedAt: 'desc' }
  });

  res.status(200).json(new ApiResponse(200, summaries, "Post summaries fetched successfully"));
});

// Generate and add new summary snapshot for all business categories
export const addPostSummary = asyncHandler(async (req: Request, res: Response) => {
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const SUMMARY_API_URL = process.env.MODULE3_API_URL;
  if (!SUMMARY_API_URL) {
    throw new ApiError(500, "MODULE3_API_URL not configured");
  }

  // Get all business categories
  const businessCategories = await prisma.businessCategory.findMany({
    orderBy: { name: 'asc' }
  });

  if (businessCategories.length === 0) {
    throw new ApiError(404, "No business categories found");
  }

  // Create post summary with category summaries
  const categorySummariesData = [];

  for (const category of businessCategories) {
    try {
      console.log(`📊 Generating summary for category: ${category.name} (${category.id})`);
      
      // Call Python API for AI-generated summary
      const summaryResponse = await axios.post(
        `${SUMMARY_API_URL}/api/analyze`,
        { categoryId: category.id },
        { 
          timeout: 600000, // 10 minutes timeout for AI processing
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (summaryResponse.data?.statusCode !== 200) {
        throw new Error(`API returned status ${summaryResponse.data?.statusCode}`);
      }

      const aiSummary = summaryResponse.data?.data?.summary || '';
      const metadata = summaryResponse.data?.data?.metadata || {};

      // Get comments for statistics
      const comments = await prisma.comment.findMany({
        where: {
          postId,
          businessCategoryId: category.id,
          status: 'ANALYZED'
        },
        select: {
          sentiment: true,
          keywords: true
        }
      });

      // Calculate statistics
      const totalComments = metadata.total_comments || comments.length;
      const positiveCount = comments.filter(c => c.sentiment?.toLowerCase() === 'positive').length;
      const negativeCount = comments.filter(c => c.sentiment?.toLowerCase() === 'negative').length;
      const neutralCount = comments.filter(c => c.sentiment?.toLowerCase() === 'neutral').length;

      // Extract top keywords
      const keywordMap = new Map<string, number>();
      comments.forEach(comment => {
        comment.keywords?.forEach(keyword => {
          keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
        });
      });
      const topKeywords = Array.from(keywordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);

      // Calculate weighted score
      const weightedScore = totalComments > 0 
        ? ((positiveCount - negativeCount) / totalComments) * 100 
        : 0;

      categorySummariesData.push({
        businessCategoryId: category.id,
        categoryName: category.name,
        summaryText: aiSummary,
        totalComments,
        positiveCount,
        negativeCount,
        neutralCount,
        weightedScore: parseFloat(weightedScore.toFixed(2)),
        topKeywords
      });

      console.log(`✅ Summary generated for ${category.name}: ${totalComments} comments`);
      
    } catch (error: any) {
      console.error(`❌ Failed to generate summary for ${category.name}:`, error.message);
      
      // Fallback: Create basic summary without AI
      const comments = await prisma.comment.findMany({
        where: {
          postId,
          businessCategoryId: category.id,
          status: 'ANALYZED'
        },
        select: {
          sentiment: true,
          keywords: true
        }
      });

      const totalComments = comments.length;
      const positiveCount = comments.filter(c => c.sentiment?.toLowerCase() === 'positive').length;
      const negativeCount = comments.filter(c => c.sentiment?.toLowerCase() === 'negative').length;
      const neutralCount = comments.filter(c => c.sentiment?.toLowerCase() === 'neutral').length;

      const keywordMap = new Map<string, number>();
      comments.forEach(comment => {
        comment.keywords?.forEach(keyword => {
          keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
        });
      });
      const topKeywords = Array.from(keywordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);

      const weightedScore = totalComments > 0 
        ? ((positiveCount - negativeCount) / totalComments) * 100 
        : 0;

      const fallbackSummary = totalComments > 0
        ? `${category.name}: ${totalComments} comments analyzed. Sentiment: ${positiveCount} positive, ${negativeCount} negative, ${neutralCount} neutral. Top keywords: ${topKeywords.slice(0, 5).join(', ')}.`
        : `${category.name}: No comments available for analysis.`;

      categorySummariesData.push({
        businessCategoryId: category.id,
        categoryName: category.name,
        summaryText: fallbackSummary,
        totalComments,
        positiveCount,
        negativeCount,
        neutralCount,
        weightedScore: parseFloat(weightedScore.toFixed(2)),
        topKeywords
      });

      console.log(`⚠️ Using fallback summary for ${category.name}`);
    }
  }

  // Create post summary with nested category summaries
  const postSummary = await prisma.postSummary.create({
    data: {
      postId,
      categorySummaries: {
        create: categorySummariesData
      }
    },
    include: {
      categorySummaries: {
        orderBy: { categoryName: 'asc' }
      }
    }
  });

  res.status(201).json(new ApiResponse(201, postSummary, "Post summary generated successfully"));
});

// Get latest summary for a post
export const getLatestSummary = asyncHandler(async (req: Request, res: Response) => {
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const latestSummary = await prisma.postSummary.findFirst({
    where: { postId },
    include: {
      categorySummaries: {
        orderBy: { categoryName: 'asc' }
      }
    },
    orderBy: { generatedAt: 'desc' }
  });

  if (!latestSummary) {
    throw new ApiError(404, "No summary found for this post");
  }

  res.status(200).json(new ApiResponse(200, latestSummary, "Latest summary fetched successfully"));
});

// Get summary by ID
export const getSummaryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Summary ID is required");
  }

  const summary = await prisma.postSummary.findUnique({
    where: { id },
    include: {
      categorySummaries: {
        orderBy: { categoryName: 'asc' }
      }
    }
  });

  if (!summary) {
    throw new ApiError(404, "Summary not found");
  }

  res.status(200).json(new ApiResponse(200, summary, "Summary fetched successfully"));
});

// Get category-specific summary from latest post summary
export const getCategorySummary = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";

  if (!categoryId) {
    throw new ApiError(400, "Category ID is required");
  }

  // Get latest post summary
  const latestSummary = await prisma.postSummary.findFirst({
    where: { postId },
    include: {
      categorySummaries: {
        where: { businessCategoryId: categoryId },
        orderBy: { categoryName: 'asc' }
      }
    },
    orderBy: { generatedAt: 'desc' }
  });

  if (!latestSummary) {
    throw new ApiError(404, "No summary found for this post");
  }

  if (latestSummary.categorySummaries.length === 0) {
    throw new ApiError(404, "No summary found for this category");
  }

  res.status(200).json(new ApiResponse(200, {
    postSummaryId: latestSummary.id,
    generatedAt: latestSummary.generatedAt,
    categorySummary: latestSummary.categorySummaries[0]
  }, "Category summary fetched successfully"));
});

// Generate word cloud 
// const generateWordCloud = asyncHandler(async (req, res) => {
//   // const { postId } = req.body;
//   // if (!postId) {
//   //   return res.status(400).json(new ApiResponse(400, null, "postId is required"));
//   // }

//   // Trigger inngest event and wait for result
//   const result = await inngest.send({
//     name: "app/generate.wordcloud",
//     // data: { postId }
//   });

//   if (!result) {
//     throw new ApiError(500, "Failed to generate word cloud");
//   }

//   res.status(200).json(new ApiResponse(200, result, "Word cloud generated"));
// });


// Get complete summary history organized as: categories → timeline → summary details
export const getAllSummaryHistory = asyncHandler(async (req: Request, res: Response) => {
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";

  // Get all post summaries with all category data
  const summaries = await prisma.postSummary.findMany({
    where: { postId },
    include: {
      categorySummaries: {
        orderBy: { categoryName: 'asc' }
      }
    },
    orderBy: { generatedAt: 'desc' }
  });

  // If no summaries exist yet, return empty structure
  if (summaries.length === 0) {
    const allCategories = await prisma.businessCategory.findMany({
      orderBy: { name: 'asc' }
    });

    const emptyCategories = [
      {
        categoryId: 'overall',
        categoryName: 'Overall',
        categoryType: 'OVERALL',
        timeline: []
      },
      ...allCategories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryType: cat.categoryType,
        timeline: []
      }))
    ];

    return res.status(200).json(new ApiResponse(200, { categories: emptyCategories }, "No summary history found yet. Generate your first summary to see data here."));
  }

  // Get all unique business categories
  const allCategories = await prisma.businessCategory.findMany({
    orderBy: { name: 'asc' }
  });

  // Build structure: categories → timeline → summary
  const categoriesWithTimeline = allCategories.map(category => {
    const timeline = summaries
      .map(summary => {
        const categorySummary = summary.categorySummaries.find(
          cs => cs.businessCategoryId === category.id
        );

        if (!categorySummary) return null;

        return {
          summaryId: summary.id,
          generatedAt: summary.generatedAt,
          summary: {
            summaryText: categorySummary.summaryText,
            totalComments: categorySummary.totalComments,
            positiveCount: categorySummary.positiveCount,
            negativeCount: categorySummary.negativeCount,
            neutralCount: categorySummary.neutralCount,
            weightedScore: categorySummary.weightedScore,
            topKeywords: categorySummary.topKeywords
          }
        };
      })
      .filter(item => item !== null);

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.categoryType,
      timeline: timeline
    };
  });

  // Add "Overall" as first category - only showing actual saved "Overall" summaries (businessCategoryId = "overall")
  const overallTimeline = summaries
    .map(summary => {
      // Find the "Overall" category summary (businessCategoryId = "overall")
      const overallCategorySummary = summary.categorySummaries.find(
        cs => cs.businessCategoryId === 'overall'
      );

      // Only include this summary if it has an "Overall" category entry
      if (!overallCategorySummary) return null;

      return {
        summaryId: summary.id,
        generatedAt: summary.generatedAt,
        summary: {
          summaryText: overallCategorySummary.summaryText,
          totalComments: overallCategorySummary.totalComments,
          positiveCount: overallCategorySummary.positiveCount,
          negativeCount: overallCategorySummary.negativeCount,
          neutralCount: overallCategorySummary.neutralCount,
          weightedScore: overallCategorySummary.weightedScore,
          topKeywords: overallCategorySummary.topKeywords
        }
      };
    })
    .filter(item => item !== null);

  const result = {
    categories: [
      {
        categoryId: 'overall',
        categoryName: 'Overall',
        categoryType: 'OVERALL',
        timeline: overallTimeline
      },
      ...categoriesWithTimeline.filter(cat => cat.timeline.length > 0)
    ]
  };

  res.status(200).json(new ApiResponse(200, result, "Complete summary history fetched successfully"));
});

// Get summary history timeline - supports both category-specific and overall view
export const getCategorySummaryHistory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";

  if (!categoryId) {
    throw new ApiError(400, "Category ID is required");
  }

  // Get all post summaries
  const summaries = await prisma.postSummary.findMany({
    where: { postId },
    include: {
      categorySummaries: categoryId === 'overall' 
        ? { orderBy: { categoryName: 'asc' } } // Get all categories for overall view
        : { 
            where: { businessCategoryId: categoryId },
            orderBy: { categoryName: 'asc' }
          }
    },
    orderBy: { generatedAt: 'desc' }
  });

  if (categoryId === 'overall') {
    // Overall view: Return timeline with aggregated stats for each snapshot
    const timelineData = summaries.map(summary => {
      // Calculate aggregated statistics
      const overallStats = summary.categorySummaries.reduce(
        (acc, category) => ({
          totalComments: acc.totalComments + category.totalComments,
          positiveCount: acc.positiveCount + category.positiveCount,
          negativeCount: acc.negativeCount + category.negativeCount,
          neutralCount: acc.neutralCount + category.neutralCount,
        }),
        { totalComments: 0, positiveCount: 0, negativeCount: 0, neutralCount: 0 }
      );

      const overallWeightedScore = overallStats.totalComments > 0
        ? ((overallStats.positiveCount - overallStats.negativeCount) / overallStats.totalComments) * 100
        : 0;

      return {
        summaryId: summary.id,
        generatedAt: summary.generatedAt,
        totalComments: overallStats.totalComments,
        positiveCount: overallStats.positiveCount,
        negativeCount: overallStats.negativeCount,
        neutralCount: overallStats.neutralCount,
        weightedScore: parseFloat(overallWeightedScore.toFixed(2)),
        categoriesCount: summary.categorySummaries.length
      };
    });

    res.status(200).json(new ApiResponse(200, timelineData, "Overall summary timeline fetched successfully"));
  } else {
    // Category-specific view: Return timeline for specific category
    const historySummaries = summaries
      .filter(summary => summary.categorySummaries.length > 0)
      .map(summary => {
        const categorySummary = summary.categorySummaries[0];
        return {
          summaryId: summary.id,
          generatedAt: summary.generatedAt,
          totalComments: categorySummary.totalComments,
          positiveCount: categorySummary.positiveCount,
          negativeCount: categorySummary.negativeCount,
          neutralCount: categorySummary.neutralCount,
          weightedScore: categorySummary.weightedScore,
          categoryName: categorySummary.categoryName
        };
      });

    if (historySummaries.length === 0) {
      throw new ApiError(404, "No summary history found for this category");
    }

    res.status(200).json(new ApiResponse(200, historySummaries, "Category summary timeline fetched successfully"));
  }
});

// Get detailed summary by ID (for when user clicks on a timeline entry)
export const getSummaryDetailsById = asyncHandler(async (req: Request, res: Response) => {
  const { summaryId, categoryId } = req.params;

  if (!summaryId) {
    throw new ApiError(400, "Summary ID is required");
  }

  const summary = await prisma.postSummary.findUnique({
    where: { id: summaryId },
    include: {
      categorySummaries: categoryId && categoryId !== 'overall'
        ? { 
            where: { businessCategoryId: categoryId },
            orderBy: { categoryName: 'asc' }
          }
        : { orderBy: { categoryName: 'asc' } }
    }
  });

  if (!summary) {
    throw new ApiError(404, "Summary not found");
  }

  if (!categoryId || categoryId === 'overall') {
    // Return full summary with all categories
    const overallStats = summary.categorySummaries.reduce(
      (acc, category) => ({
        totalComments: acc.totalComments + category.totalComments,
        positiveCount: acc.positiveCount + category.positiveCount,
        negativeCount: acc.negativeCount + category.negativeCount,
        neutralCount: acc.neutralCount + category.neutralCount,
      }),
      { totalComments: 0, positiveCount: 0, negativeCount: 0, neutralCount: 0 }
    );

    const overallWeightedScore = overallStats.totalComments > 0
      ? ((overallStats.positiveCount - overallStats.negativeCount) / overallStats.totalComments) * 100
      : 0;

    const keywordMap = new Map<string, number>();
    summary.categorySummaries.forEach(category => {
      category.topKeywords.forEach(keyword => {
        keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
      });
    });
    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);

    res.status(200).json(new ApiResponse(200, {
      summaryId: summary.id,
      generatedAt: summary.generatedAt,
      overall: {
        ...overallStats,
        weightedScore: parseFloat(overallWeightedScore.toFixed(2)),
        topKeywords
      },
      categories: summary.categorySummaries.map(cat => ({
        categoryId: cat.businessCategoryId,
        categoryName: cat.categoryName,
        summaryText: cat.summaryText,
        totalComments: cat.totalComments,
        positiveCount: cat.positiveCount,
        negativeCount: cat.negativeCount,
        neutralCount: cat.neutralCount,
        weightedScore: cat.weightedScore,
        topKeywords: cat.topKeywords
      }))
    }, "Overall summary details fetched successfully"));
  } else {
    // Return category-specific summary
    if (summary.categorySummaries.length === 0) {
      throw new ApiError(404, "No summary found for this category");
    }

    const categorySummary = summary.categorySummaries[0];
    
    res.status(200).json(new ApiResponse(200, {
      summaryId: summary.id,
      generatedAt: summary.generatedAt,
      category: {
        categoryId: categorySummary.businessCategoryId,
        categoryName: categorySummary.categoryName,
        summaryText: categorySummary.summaryText,
        totalComments: categorySummary.totalComments,
        positiveCount: categorySummary.positiveCount,
        negativeCount: categorySummary.negativeCount,
        neutralCount: categorySummary.neutralCount,
        weightedScore: categorySummary.weightedScore,
        topKeywords: categorySummary.topKeywords
      }
    }, "Category summary details fetched successfully"));
  }
});

// Generate overall summary by calling Python API with categoryId=overall and save to database
export const generateOverallSummary = asyncHandler(async (req: Request, res: Response) => {
  const postId = "a90315d4-b2b1-4836-a848-b47e318a5fa5";

  const SUMMARY_API_URL = process.env.MODULE3_API_URL;
  if (!SUMMARY_API_URL) {
    throw new ApiError(500, "MODULE3_API_URL not configured");
  }

  try {
    console.log(`📊 Generating overall summary for all comments`);
    
    // Call Python API for AI-generated overall summary
    const summaryResponse = await axios.post(
      `${SUMMARY_API_URL}/api/analyze`,
      { categoryId: "overall" },
      { 
        timeout: 600000, // 10 minutes timeout for AI processing
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (summaryResponse.data?.statusCode !== 200) {
      throw new Error(`API returned status ${summaryResponse.data?.statusCode}`);
    }

    const aiSummary = summaryResponse.data?.data?.summary || '';
    const metadata = summaryResponse.data?.data?.metadata || {};

    // Get all comments for statistics
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: 'ANALYZED'
      },
      select: {
        sentiment: true,
        keywords: true,
        businessCategoryId: true
      }
    });

    // Calculate statistics
    const totalComments = metadata.total_comments || comments.length;
    const positiveCount = comments.filter(c => c.sentiment?.toLowerCase() === 'positive').length;
    const negativeCount = comments.filter(c => c.sentiment?.toLowerCase() === 'negative').length;
    const neutralCount = comments.filter(c => c.sentiment?.toLowerCase() === 'neutral').length;

    // Extract top keywords
    const keywordMap = new Map<string, number>();
    comments.forEach(comment => {
      comment.keywords?.forEach(keyword => {
        keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
      });
    });
    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);

    // Calculate weighted score
    const weightedScore = totalComments > 0 
      ? ((positiveCount - negativeCount) / totalComments) * 100 
      : 0;

    // Get category breakdown
    const categoryStats = new Map<string, { positive: number; negative: number; neutral: number; total: number }>();
    comments.forEach(comment => {
      const catId = comment.businessCategoryId;
      if (!categoryStats.has(catId)) {
        categoryStats.set(catId, { positive: 0, negative: 0, neutral: 0, total: 0 });
      }
      const stats = categoryStats.get(catId)!;
      stats.total++;
      if (comment.sentiment?.toLowerCase() === 'positive') stats.positive++;
      else if (comment.sentiment?.toLowerCase() === 'negative') stats.negative++;
      else if (comment.sentiment?.toLowerCase() === 'neutral') stats.neutral++;
    });

    // Create a special "Overall" category summary entry in the database
    // We'll use a special businessCategoryId = "overall" to mark this as overall summary
    const postSummary = await prisma.postSummary.create({
      data: {
        postId,
        categorySummaries: {
          create: {
            businessCategoryId: "overall", // Special ID for overall summary
            categoryName: "Overall",
            summaryText: aiSummary,
            totalComments,
            positiveCount,
            negativeCount,
            neutralCount,
            weightedScore: parseFloat(weightedScore.toFixed(2)),
            topKeywords
          }
        }
      },
      include: {
        categorySummaries: true
      }
    });

    const categoryBreakdown = await Promise.all(
      Array.from(categoryStats.entries()).map(async ([catId, stats]) => {
        const category = await prisma.businessCategory.findUnique({
          where: { id: catId },
          select: { name: true }
        });
        return {
          categoryId: catId,
          categoryName: category?.name || 'Unknown',
          totalComments: stats.total,
          positiveCount: stats.positive,
          negativeCount: stats.negative,
          neutralCount: stats.neutral,
          weightedScore: stats.total > 0 ? ((stats.positive - stats.negative) / stats.total) * 100 : 0
        };
      })
    );

    const overallSummary = {
      summaryId: postSummary.id,
      generatedAt: postSummary.generatedAt,
      summaryText: aiSummary,
      totalComments,
      positiveCount,
      negativeCount,
      neutralCount,
      weightedScore: parseFloat(weightedScore.toFixed(2)),
      topKeywords,
      categoryBreakdown,
      processingTime: metadata.processing_time_seconds || 0
    };

    console.log(`✅ Overall summary generated and saved to database: ${totalComments} comments`);

    res.status(201).json(new ApiResponse(201, overallSummary, "Overall summary generated and saved successfully"));
    
  } catch (error: any) {
    console.error(`❌ Failed to generate overall summary:`, error.message);
    throw new ApiError(500, `Failed to generate overall summary: ${error.message}`);
  }
});

export { 
  // generateWordCloud
};