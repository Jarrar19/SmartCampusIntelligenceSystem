import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPerformanceAnalysis,
  tutorChat,
  generateStudyPlan,
} from '../controllers/aiController';

const router = Router();

router.use(authenticate);

router.get('/performance-analysis', getPerformanceAnalysis);
router.post('/tutor-chat', tutorChat);
router.post('/generate-study-plan', generateStudyPlan);

export default router;
