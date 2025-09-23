import { Router } from 'express';
import { generateCognitiveAssessment, getCognitiveAssessment } from '../controllers/cognitive-assessment-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const router = Router();

router.use(verifyJWT);
// Below are all protected routes

// Generate cognitive assessment after quiz completion
router.route('/generate').post(generateCognitiveAssessment);

// Get cognitive assessment for a specific quiz
router.route('/:quizId').get(getCognitiveAssessment);

export default router;
