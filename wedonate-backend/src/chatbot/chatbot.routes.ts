import { Router } from 'express';
import { handleChatRequest } from './chatbot.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Too many requests to the AI Assistant. Please wait a moment.' }
});

const router = Router();

// Allow public access, but identity will be parsed if token exists
router.post('/', chatLimiter, optionalAuthenticate, handleChatRequest);

export default router;
