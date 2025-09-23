import { Router } from 'express';
import {
  analyzeGameSession,
  getUserGameHistory,
  getUserTraitsSummary,
} from '../controllers/game-analytics-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const gameAnalyticsRouter = Router();

gameAnalyticsRouter.use(verifyJWT);
// Analyze game session and return traits
gameAnalyticsRouter.route('/analyze').post(analyzeGameSession);

// Get user's game history
gameAnalyticsRouter.route('/history').get(getUserGameHistory);

// Get user's traits summary
gameAnalyticsRouter.route('/traits').get(getUserTraitsSummary);

export default gameAnalyticsRouter;
