import { Router } from 'express';
import {
  createShortQuestionExam,
  deleteShortQuestionExam,
  getExamQuestions,
  getShortQuestionExams,
  submitExamAnswers,
} from '../controllers/question-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const question_router = Router();

// Short question exam routes
question_router
  .route('/short-questions/create')
  .post(verifyJWT, createShortQuestionExam);

question_router
  .route('/short-questions/exams/:subjectId')
  .get(verifyJWT, getShortQuestionExams);

question_router
  .route('/short-questions/exam/:examId')
  .get(verifyJWT, getExamQuestions);

question_router
  .route('/short-questions/exam/:examId/submit')
  .post(verifyJWT, submitExamAnswers);

question_router
  .route('/short-questions/exam/:examId')
  .delete(verifyJWT, deleteShortQuestionExam);

export default question_router;
