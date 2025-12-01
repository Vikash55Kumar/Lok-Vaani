import { Router } from 'express';
import {
  getCommentsByPostId,
  getCommentById,
  getCommentCounts,
  getCategorizedCommentCounts,
  getCommentsWeightage,
  verifyCompanyComment
} from '../controller/comment.controller';

const router = Router();

// Get comments by post ID
router.get('/comment-by-post/:postId', getCommentsByPostId);

router.get('/comment-counts/:postId', getCommentCounts);

router.get('/category-comment-counts/:postId', getCategorizedCommentCounts);

router.get('/comment-weightage/:postId', getCommentsWeightage);
// Get comment by ID
router.get('/get-comment-by-id/:id', getCommentById);

// Verify if company has existing comment
router.get('/verify-company', verifyCompanyComment);

export default router;