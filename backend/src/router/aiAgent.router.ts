import { Router } from 'express';
import { syncAgentContext, askAgent, getAgentStatus } from '../controller/aiAgent.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

//  Initialize or refresh AI context for a draft
router.post('/sync', authenticate, syncAgentContext);

//  Ask a question about a specific draft
router.post('/ask', authenticate, askAgent);

//  Get AI Agent initialization status for a draft
router.get('/status/:postId', authenticate, getAgentStatus);

export default router;