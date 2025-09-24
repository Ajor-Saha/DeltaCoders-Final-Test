import { Router } from 'express';
import {
  analyzeQuizMentalStatus,
  deleteQuiz,
  getQuizResults,
  submitQuiz,
} from '../controllers/quiz-controllers';
import {
  createAllTopics,
  createQuiz,
  generateLearningContent,
  generateQuiz,
  generateShortQuestions,
  generateTopicsBasedOnPreferences,
  getQuizById,
  getQuizzesByTopic,
  getStarterFeed,
} from '../controllers/topic-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const topic_router = Router();

topic_router.use(verifyJWT);
//below are all protected routes
topic_router.route('/generate-topic').post(createAllTopics);
topic_router
  .route('/generate-topics-preferences')
  .post(generateTopicsBasedOnPreferences);
topic_router.route('/generate-content').post(generateLearningContent);
topic_router.route('/generate-quiz').post(generateQuiz);

topic_router.route('/starter-feed').get(getStarterFeed);
topic_router.route('/generate-short-questions').post(generateShortQuestions);

topic_router.route('/create-quiz').post(createQuiz);
topic_router.route('/submit-quiz').post(submitQuiz);
topic_router.route('/cognitive-assessment').post(analyzeQuizMentalStatus);
topic_router.route('/quizzes/:topicId').get(getQuizzesByTopic);
topic_router.route('/quiz/:quizId').get(getQuizById);
topic_router.route('/quiz/:quizId/results').get(getQuizResults);
topic_router.route('/quiz/:quizId').delete(deleteQuiz);

export default topic_router;
