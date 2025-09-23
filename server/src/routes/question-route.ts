import { Router } from 'express';
import { createShortQuestionExam } from '../controllers/question-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const question_router = Router();

question_router
  .route('/generate-short-question-exam')
  .post(verifyJWT, createShortQuestionExam);

export default question_router;
