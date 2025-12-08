import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { inngest } from '../inngest/client';

// Get timeline summaries for a post
export const getPostSummaries = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement get post summaries logic
  res.status(200).json(new ApiResponse(200, [], "Post summaries fetched successfully"));
});

// Add new summary snapshot
export const addPostSummary = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement add post summary logic
  res.status(201).json(new ApiResponse(201, {}, "Post summary added successfully"));
});

// Get latest summary for a post
export const getLatestSummary = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement get latest summary logic
  res.status(200).json(new ApiResponse(200, {}, "Latest summary fetched successfully"));
});

// Get summary by ID
export const getSummaryById = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement get summary by ID logic
  res.status(200).json(new ApiResponse(200, {}, "Summary fetched successfully"));
});

// Generate word cloud 
const generateWordCloud = asyncHandler(async (req, res) => {
  // const { postId } = req.body;
  // if (!postId) {
  //   return res.status(400).json(new ApiResponse(400, null, "postId is required"));
  // }

  // Trigger inngest event and wait for result
  const result = await inngest.send({
    name: "app/generate.wordcloud",
    // data: { postId }
  });

  if (!result) {
    throw new ApiError(500, "Failed to generate word cloud");
  }

  res.status(200).json(new ApiResponse(200, result, "Word cloud generated"));
});


export { 
  generateWordCloud
};