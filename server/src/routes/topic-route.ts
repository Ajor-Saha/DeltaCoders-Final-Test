import { Router } from 'express';
import { submitQuiz } from '../controllers/quiz-controllers';
import {
  createAllTopics,
  createQuiz,
  generateLearningContent,
  generateQuiz,
  generateShortQuestions,
  getExternalResources,
  getQuizById,
  getQuizzesByTopic,
} from '../controllers/topic-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const topic_router = Router();

topic_router.route('/generate-topic').post(createAllTopics);
topic_router.route('/generate-content').post(generateLearningContent);
topic_router.route('/generate-quiz').post(verifyJWT, generateQuiz);
topic_router.route('/external-resources').post(getExternalResources);
topic_router.route('/generate-short-questions').post(generateShortQuestions);
topic_router.route('/create-quiz').post(verifyJWT, createQuiz);
topic_router.route('/submit-quiz').post(verifyJWT, submitQuiz);
topic_router.route('/quizzes/:topicId').get(verifyJWT, getQuizzesByTopic);
topic_router.route('/quiz/:quizId').get(verifyJWT, getQuizById);

export default topic_router;
