import { Router } from 'express';
import {
  createAllTopics,
  createQuiz,
  generateLearningContent,
  generateQuiz,
  generateShortQuestions,
  getExternalResources,
} from '../controllers/topic-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const topic_router = Router();

topic_router.route('/generate-topic').post(createAllTopics);
topic_router.route('/generate-content').post(generateLearningContent);
topic_router.route('/generate-quiz').post(verifyJWT, generateQuiz);
topic_router.route('/external-resources').post(getExternalResources);
topic_router.route('/generate-short-questions').post(generateShortQuestions);
topic_router.route('/create-quiz').post(verifyJWT, createQuiz);

export default topic_router;
