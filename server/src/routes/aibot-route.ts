import { Router } from 'express';
import {
  checkUserDataStatus,
  deactivateUserChat,
  getUserChatHistory,
  queryUserChatbot,
  syncUserDataToVectorDB,
} from '../controllers/aibot-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const aibot_router = Router();

// All routes require authentication for AI chatbot
aibot_router.route('/check-data-status').get(verifyJWT, checkUserDataStatus);
aibot_router.route('/sync-data').post(verifyJWT, syncUserDataToVectorDB);
aibot_router.route('/chat').post(verifyJWT, queryUserChatbot);
aibot_router.route('/chat-history').get(verifyJWT, getUserChatHistory);
aibot_router
  .route('/chat/:chatId/deactivate')
  .patch(verifyJWT, deactivateUserChat);

export default aibot_router;
