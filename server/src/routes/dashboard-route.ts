import { Router } from 'express';
import {
  getDashboardStats,
  getRecentQuizzes,
} from '../controllers/dashboard-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const dashboard_router = Router();

dashboard_router.use(verifyJWT);
// Below are all protected routes

// Get dashboard statistics for authenticated user
dashboard_router.route('/stats').get(getDashboardStats);

// Get recent 5 quiz results for authenticated user
dashboard_router.route('/recent-quizzes').get(getRecentQuizzes);

export default dashboard_router;
