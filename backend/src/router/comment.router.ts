import { Router } from 'express';
import {
  getCommentsByPostId,
  getCommentById,
  getCommentCounts,
  getCategorizedCommentCounts,
  getCommentsWeightage,
  verifyCompanyComment,
  getAllCommentsWithSentimentCSV,
  getAllCommentsWithSentiment,
  getAllComments,
  manualCommentFetch,
  deleteCommentsExceptDate,
  getClauseWiseSentiment,
  getTopNegativeComments
} from '../controller/comment.controller';
import { upload } from '../middleware/multer';

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

router.get('/tabular-comment-csv', getAllCommentsWithSentimentCSV);
router.get('/tabular-comment', getAllCommentsWithSentiment);
router.get('/cloud-comment', getAllComments);
router.get('/clause-wise-sentiment/:postId', getClauseWiseSentiment);
router.get('/top-negative-comments/:postId', getTopNegativeComments);
router.route("/manual-comment").post(upload.fields([{ name: "file", maxCount: 1 }]), manualCommentFetch);
router.delete('/cleanup-except-dec8', deleteCommentsExceptDate);

export default router;