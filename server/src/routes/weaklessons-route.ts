import { Router } from 'express';
import {
  generateWeakLessons,
  getUserWeakLessons,
  regenerateLatestWeakLessons,
} from '../controllers/weaklessons-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const weakLessons_router = Router();

// Protected routes (require authentication)
weakLessons_router
  .route('/generate/:subjectId')
  .post(verifyJWT, generateWeakLessons);
weakLessons_router.route('/user/:subjectId').get(verifyJWT, getUserWeakLessons); // subjectId can be 'all' for all subjects
weakLessons_router
  .route('/regenerate-weak-topics')
  .post(verifyJWT, regenerateLatestWeakLessons); // Get all weak lessons for user

export default weakLessons_router;
