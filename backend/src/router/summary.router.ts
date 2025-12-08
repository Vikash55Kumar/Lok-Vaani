import { Router } from 'express';
import {
  getPostSummaries,
  addPostSummary,
  getLatestSummary,
  getSummaryById
} from '../controller/summary.controller';

const router = Router({ mergeParams: true });

// GET /api/v1/posts/:postId/summaries - Get timeline summaries for a post
router.get('/', getPostSummaries);

// POST /api/v1/posts/:postId/summaries - Add new summary snapshot
router.post('/', addPostSummary);

// GET /api/v1/posts/:postId/summaries/latest - Get latest summary
router.get('/latest', getLatestSummary);

// GET /api/v1/posts/:postId/summaries/:id - Get summary by ID
router.get('/:id', getSummaryById);

export default router;