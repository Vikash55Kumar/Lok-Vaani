import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../db/index';
import { logSecurityEvent } from '../utility/auditLogger';
import { convertPdfToBase64 } from '../utility/uploadPdf';

// Create new post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, standardTitle, standardDescription, postType, issuedBy, issueDate, deadline, language } = req.body;

  if (!title || !description || !postType || !issuedBy || !issueDate) {
    throw new ApiError(400, "All fields are required");
  }

  const file = req.file;
  if (!file) {
    throw new ApiError(400, 'File is required');
  }

  const pdfBase64 = convertPdfToBase64(file);

  try {
    const post = await prisma.post.create({
      data: {
        title,
        description,
        standardTitle,
        standardDescription,
        postType,
        issuedBy,
        issueDate: new Date(issueDate),
        deadline: deadline ? new Date(deadline) : null,
        language: language || "ENGLISH",
        pdfBase64 // Store base64 string
      }
    });

    res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to create post");
  }
});

// Get all posts
export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            comments: true,
            summaries: true
          }
        }
      }
    });

    res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw new ApiError(500, "Failed to fetch posts");
  }
});

// Get post by ID
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const post = await prisma.post.findUnique({
    where: { id },
  })

  if(!post) {
    await logSecurityEvent('POST_FETCH_FAILED', "while fetching post", { id, reason: 'Post not found' });
    throw new ApiError(404, "Post not found");
  }
  res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
});

// Update post
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement update post logic
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, description, standardTitle, standardDescription, postType, issuedBy, issueDate, deadline, language, pdfBase64 } = req.body;

  if (!title || !description || !standardTitle || !standardDescription || !postType || !issuedBy || !issueDate) {
    throw new ApiError(400, "All fields are required");
  }

  const post = await prisma.post.findUnique({
    where: { id }
  });

  if (!post) {
    await logSecurityEvent('POST_UPDATE_FAILED', "while updating post", { id, reason: 'Post not found' });
    throw new ApiError(404, "Post not found");
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      title,
      description,
      standardTitle,
      standardDescription,
      postType,
      issuedBy,
      issueDate: new Date(issueDate),
      deadline: deadline ? new Date(deadline) : null,
      language,
      pdfBase64
    }
  });

  if (!updatedPost) {
    await logSecurityEvent('POST_UPDATE_FAILED', "while updating post", { id, reason: 'Post update failed' });
    throw new ApiError(500, "Failed to update post");
  }

  res.status(200).json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

// Delete post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const post = await prisma.post.findUnique({
    where: { id }
  });

  if (!post) {
    await logSecurityEvent('POST_DELETE_FAILED', "while deleting post", { id, reason: 'Post not found' });
    throw new ApiError(404, "Post not found");
  }

  const deletedPost = await prisma.post.delete({
    where: { id }
  });

  if (!deletedPost) {
    await logSecurityEvent('POST_DELETE_FAILED', "while deleting post", { id, reason: 'Post delete failed' });
    throw new ApiError(500, "Failed to delete post");
  }

  await logSecurityEvent('POST_DELETED', "Post deleted successfully", { id });
  res.status(200).json(new ApiResponse(200, deletedPost, "Post deleted successfully"));
});

// Upload PDF for post
export const uploadPostPdf = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!req.file) {
    throw new ApiError(400, "PDF file is required");
  }

  const post = await prisma.post.findUnique({
    where: { id }
  });

  if (!post) {
    await logSecurityEvent('POST_PDF_UPLOAD_FAILED', "while uploading PDF", { id, reason: 'Post not found' });
    throw new ApiError(404, "Post not found");
  }

  // Here, you would typically upload the file to a storage service (e.g., AWS S3) and get the file URL.
  // For simplicity, we'll just use the filename as a placeholder for the URL.
  const pdfUrl = `/uploads/${req.file.filename}`;

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { pdfBase64: pdfUrl }
  });

  if (!updatedPost) {
    await logSecurityEvent('POST_PDF_UPLOAD_FAILED', "while uploading PDF", { id, reason: 'PDF upload failed' });
    throw new ApiError(500, "Failed to upload PDF");
  }

  await logSecurityEvent('POST_PDF_UPLOADED', "PDF uploaded successfully", { id, pdfUrl });
  res.status(200).json(new ApiResponse(200, { pdfUrl }, "PDF uploaded successfully"));
});
