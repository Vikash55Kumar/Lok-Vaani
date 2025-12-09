import { Router } from 'express';
import {
  getPostSummaries,
  addPostSummary,
  getLatestSummary,
  getSummaryById,
  getCategorySummary,
  getCategorySummaryHistory,
  generateOverallSummary,
  getSummaryDetailsById,
  getAllSummaryHistory
} from '../controller/summary.controller';

const router = Router({ mergeParams: true });

// GET /api/v1/posts/:postId/summaries - Get timeline summaries for a post
router.get('/', getPostSummaries);

// POST /api/v1/posts/:postId/summaries - Add new summary snapshot
router.post('/', addPostSummary);

// GET /api/v1/posts/:postId/summaries/latest - Get latest summary
router.get('/latest', getLatestSummary);

// GET /api/v1/posts/:postId/summaries/overall - Generate overall summary (all comments, categoryId=overall)
router.get('/overall', generateOverallSummary);

// GET /api/v1/posts/:postId/summaries/history-all - Get complete history: categories → timeline → summary
router.get('/history-all', getAllSummaryHistory);

// GET /api/v1/posts/:postId/summaries/category/:categoryId - Get category-specific summary
router.get('/category/:categoryId', getCategorySummary);

// GET /api/v1/posts/:postId/summaries/history/:categoryId - Get timeline list (supports 'overall' or specific categoryId)
router.get('/history/:categoryId', getCategorySummaryHistory);

// GET /api/v1/posts/:postId/summaries/details/:summaryId/:categoryId - Get detailed summary when clicking timeline entry
router.get('/details/:summaryId/:categoryId', getSummaryDetailsById);

// GET /api/v1/posts/:postId/summaries/:id - Get summary by ID
router.get('/:id', getSummaryById);

export default router;