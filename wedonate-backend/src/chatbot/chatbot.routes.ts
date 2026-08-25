import { Router } from 'express';
import { handleChatRequest, getChatHistory, clearChatHistory } from './chatbot.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Increased to allow history fetching
  message: { error: 'Too many requests to the AI Assistant. Please wait a moment.' }
});

const router = Router();

// Allow public access, but identity will be parsed if token exists
router.post('/', chatLimiter, optionalAuthenticate, handleChatRequest);
router.get('/', authenticate, getChatHistory);
router.delete('/', authenticate, clearChatHistory);

export default router;
