import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  getPerformanceAnalysis,
  tutorChat,
  generateStudyPlan,
} from '../controllers/aiController';

const router = Router();

router.use(authenticate);

router.get('/performance-analysis', asyncHandler(getPerformanceAnalysis));
router.post('/tutor-chat', asyncHandler(tutorChat));
router.post('/generate-study-plan', asyncHandler(generateStudyPlan));

export default router;
