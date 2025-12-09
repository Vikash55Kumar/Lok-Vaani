import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getEmbedding, splitTextIntoChunks, generateAIResponse, delay } from '../utility/aiAgent';
import { asyncHandler } from '../utility/asyncHandler';
import { ApiError } from '../utility/ApiError';
import ApiResponse from '../utility/ApiResponse';

const prisma = new PrismaClient();

interface SyncAgentRequest {
  postId: string;
}

interface AskAgentRequest {
  postId: string;
  question: string;
}

/**
 * Initialize AI Agent context for a specific draft (sync vector embeddings)
 * This is called when analyst clicks "Ask with Agent" for the first time
 * or clicks "Refresh AI Context" to include new comments
 */
export const syncAgentContext = asyncHandler(async (req: Request, res: Response) => {
  const { postId }: SyncAgentRequest = req.body;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    // 1. Check if post exists and get extracted text
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { 
        id: true, 
        title: true,
        extractedText: true 
      },
    });

    if (!post) {
      throw new ApiError(404, "Draft not found");
    }

    let processedChunks = 0;
    let processedComments = 0;

    // 2. Process draft text into chunks if not already done
    const existingChunkCount = await prisma.draftChunk.count({ 
      where: { postId } 
    });

    if (existingChunkCount === 0 && post.extractedText) {
      const chunks = splitTextIntoChunks(post.extractedText);
      
      for (const content of chunks) {
        try {
          const vector = await getEmbedding(content);
          
          await prisma.$executeRawUnsafe(
            `INSERT INTO "draft_chunks" ("id", "postId", "content", "embedding")
             VALUES (gen_random_uuid(), $1, $2, $3::vector)`,
            postId,
            content,
            vector
          );
          
          processedChunks++;
          
          // Rate limiting: small delay between embeddings
          await delay(300);
        } catch (error) {
          console.error(`Failed to process draft chunk: ${error}`);
        }
      }
    }

    // 3. Process comments without vectors (new comments)
    const commentsWithoutVectors = await prisma.comment.findMany({
      where: {
        postId,
        commentVector: null, // No CommentVector exists
        isSpam: false, // Exclude spam
        status: "ANALYZED" // Only processed comments
      },
      select: { id: true, rawComment: true },
      take: 2000, // Limit to prevent memory issues
    });

    // Process comments in batches to handle rate limits
    const BATCH_SIZE = 20;
    for (let i = 0; i < commentsWithoutVectors.length; i += BATCH_SIZE) {
      const batch = commentsWithoutVectors.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (comment) => {
        try {
          const text = comment.rawComment.slice(0, 2000); // Truncate long comments
          const vector = await getEmbedding(text);
          
          await prisma.$executeRawUnsafe(
            `INSERT INTO "comment_vectors" ("id", "commentId", "embedding")
             VALUES (gen_random_uuid(), $1, $2::vector)
             ON CONFLICT ("commentId") DO NOTHING`,
            comment.id,
            vector
          );
          
          return true;
        } catch (error) {
          console.error(`Failed to process comment ${comment.id}: ${error}`);
          return false;
        }
      });

      const results = await Promise.all(batchPromises);
      processedComments += results.filter(Boolean).length;
      
      // Delay between batches to handle rate limits
      if (i + BATCH_SIZE < commentsWithoutVectors.length) {
        await delay(500);
      }
    }

    res.status(200).json(
      new ApiResponse(200, {
        processedChunks,
        processedComments,
        totalCommentsInDraft: await prisma.comment.count({ where: { postId, isSpam: false } })
      }, "AI Agent context synchronized successfully")
    );

  } catch (error) {
    console.error("Sync agent context error:", error);
    throw new ApiError(500, `Failed to sync agent context: ${error}`);
  }
});

/**
 * Ask a question to the AI Agent about a specific draft
 * Uses RAG (Retrieval Augmented Generation) with pgvector similarity search
 */
export const askAgent = asyncHandler(async (req: Request, res: Response) => {
  const { postId, question }: AskAgentRequest = req.body;

  if (!postId || !question) {
    throw new ApiError(400, "Post ID and question are required");
  }

  try {
    // 1. Generate embedding for the question
    const questionVector = await getEmbedding(question);

    // 2. Retrieve most relevant draft chunks using pgvector similarity search
    const relevantDraftChunks: { content: string }[] = await prisma.$queryRawUnsafe(
      `SELECT "content"
       FROM "draft_chunks"
       WHERE "postId" = $1
       ORDER BY "embedding" <=> $2::vector
       LIMIT 3`,
      postId,
      questionVector
    );

    // 3. Retrieve most relevant comments with business category info
    const relevantComments: { 
      rawComment: string; 
      sentiment: string | null; 
      name: string;
      stakeholderName: string;
    }[] = await prisma.$queryRawUnsafe(
      `SELECT c."rawComment", c."sentiment", bc."name", c."stakeholderName"
       FROM "comments" c
       JOIN "comment_vectors" cv ON c."id" = cv."commentId"
       JOIN "business_categories" bc ON c."businessCategoryId" = bc."id"
       WHERE c."postId" = $1 AND c."isSpam" = false
       ORDER BY cv."embedding" <=> $2::vector
       LIMIT 10`,
      postId,
      questionVector
    );

    // 4. Get latest post summary for aggregate statistics
    const postSummary = await prisma.postSummary.findFirst({
      where: { postId },
      include: {
        categorySummaries: true
      },
      orderBy: { generatedAt: 'desc' },
    });

    // 5. Get post title for context
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { title: true }
    });

    // 6. Build context for AI
    const draftContext = relevantDraftChunks
      .map(chunk => `- ${chunk.content}`)
      .join('\n');

    const commentContext = relevantComments
      .map(comment => 
        `- [${comment.name} / ${comment.sentiment || 'UNKNOWN'}] ${comment.stakeholderName}: "${comment.rawComment}"`
      )
      .join('\n');

    // Aggregate statistics from category summaries
    let statisticsContext = "No aggregate statistics available for this draft.";
    
    if (postSummary && postSummary.categorySummaries.length > 0) {
      const totalComments = postSummary.categorySummaries.reduce((sum, cat) => sum + cat.totalComments, 0);
      const positiveCount = postSummary.categorySummaries.reduce((sum, cat) => sum + cat.positiveCount, 0);
      const negativeCount = postSummary.categorySummaries.reduce((sum, cat) => sum + cat.negativeCount, 0);
      const neutralCount = postSummary.categorySummaries.reduce((sum, cat) => sum + cat.neutralCount, 0);
      
      // Collect all keywords across categories
      const allKeywords = new Map<string, number>();
      postSummary.categorySummaries.forEach(cat => {
        cat.topKeywords?.forEach(keyword => {
          allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + 1);
        });
      });
      const topKeywords = Array.from(allKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);

      const avgWeightedScore = totalComments > 0
        ? postSummary.categorySummaries.reduce((sum, cat) => sum + (cat.weightedScore || 0) * cat.totalComments, 0) / totalComments
        : 0;

      statisticsContext = `Overall Statistics for this draft:
- Total Comments: ${totalComments}
- Positive: ${positiveCount} (${totalComments > 0 ? Math.round((positiveCount / totalComments) * 100) : 0}%)
- Negative: ${negativeCount} (${totalComments > 0 ? Math.round((negativeCount / totalComments) * 100) : 0}%)
- Neutral: ${neutralCount} (${totalComments > 0 ? Math.round((neutralCount / totalComments) * 100) : 0}%)
- Average Weighted Score: ${avgWeightedScore.toFixed(2)}
- Top Keywords: ${topKeywords.join(', ') || 'None'}

Category Breakdown:
${postSummary.categorySummaries.map(cat => 
  `  • ${cat.categoryName}: ${cat.totalComments} comments (Score: ${cat.weightedScore?.toFixed(2) || 'N/A'})`
).join('\n')}`;
    }

    const fullContext = `
Draft Title: ${post?.title || 'Unknown'}

${statisticsContext}

Most Relevant Draft Sections:
${draftContext || 'No relevant draft sections found.'}

Most Relevant Stakeholder Comments:
${commentContext || 'No relevant comments found.'}
`;

    const systemPrompt = `You are the LokVaani Policy Assistant, an expert AI agent helping MCA analysts understand public consultation feedback.

Your capabilities:
- Analyze draft legislation and stakeholder comments
- Provide insights on sentiment, concerns, and recommendations
- Compare different stakeholder categories (Banks, Startups, NGOs, etc.)
- Identify potential legal risks and implementation challenges
- Suggest policy improvements based on feedback

Guidelines:
- Answer questions based ONLY on the provided context
- When providing statistics, use the exact numbers given in the statistics section
- For category comparisons, highlight different perspectives clearly
- If asked about specific clauses, reference the draft sections provided
- If information is insufficient, state this clearly instead of guessing
- Cite stakeholder categories when referencing comments (e.g., "Banks are concerned about...")
- For legal risk questions, focus on concerns raised in comments about constitutionality, implementation challenges, etc.`;

    // 7. Generate AI response
    const answer = await generateAIResponse(systemPrompt, fullContext, question);

    res.status(200).json(
      new ApiResponse(200, {
        answer,
        context: {
          draftChunksFound: relevantDraftChunks.length,
          commentsFound: relevantComments.length,
          hasStatistics: !!postSummary
        }
      }, "Question answered successfully")
    );

  } catch (error) {
    console.error("Ask agent error:", error);
    throw new ApiError(500, `Failed to answer question: ${error}`);
  }
});

//  Get AI Agent status for a draft (check if initialized)
export const getAgentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    const [draftChunkCount, commentVectorCount, totalComments] = await Promise.all([
      prisma.draftChunk.count({ where: { postId } }),
      prisma.commentVector.count({ 
        where: { 
          comment: { postId, isSpam: false } 
        } 
      }),
      prisma.comment.count({ where: { postId, isSpam: false } })
    ]);

    const isInitialized = draftChunkCount > 0;
    const commentsProcessed = commentVectorCount;
    const needsSync = totalComments > commentsProcessed;

    res.status(200).json(
      new ApiResponse(200, {
        isInitialized,
        draftChunkCount,
        commentsProcessed,
        totalComments,
        needsSync
      }, "Agent status retrieved successfully")
    );

  } catch (error) {
    console.error("Get agent status error:", error);
    throw new ApiError(500, `Failed to get agent status: ${error}`);
  }
});