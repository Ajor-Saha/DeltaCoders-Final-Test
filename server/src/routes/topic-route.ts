import { Router } from 'express';
import {
  createAllTopics,
  generateLearningContent,
  generateQuiz,
  generateShortQuestions,
  getExternalResources,
} from '../controllers/topic-controllers';

const topic_router = Router();

topic_router.route('/generate-topic').post(createAllTopics);
topic_router.route('/generate-content').post(generateLearningContent);
topic_router.route('/generate-quiz').post(generateQuiz);
topic_router.route('/external-resources').post(getExternalResources);
topic_router.route('/generate-short-questions').post(generateShortQuestions);

export default topic_router;
