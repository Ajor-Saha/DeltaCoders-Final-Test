import { Router } from 'express';
import {
  createAllTopics,
  generateLearningContent,
  generateQuiz,
} from '../controllers/topic-controllers';

const topic_router = Router();

topic_router.route('/generate-topic').post(createAllTopics);
topic_router.route('/generate-content').post(generateLearningContent);
topic_router.route('/generate-quiz').post(generateQuiz);

export default topic_router;
