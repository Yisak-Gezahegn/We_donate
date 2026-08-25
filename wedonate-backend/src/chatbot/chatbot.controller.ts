import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { processChatMessage } from './chatbot.service';
import { RoleScope } from './chatbot.types';

export const handleChatRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let roleScope: RoleScope = 'UNAUTHENTICATED';
    let userId = '';

    if (req.user) {
      const userRole = req.user.role;
      userId = req.user.userId;
      if (userRole === 'USER') roleScope = 'USER';
      else if (userRole === 'KEBELE_ADMIN') roleScope = 'KEBELE_ADMIN';
      else if (userRole === 'CITY_ADMIN') roleScope = 'CITY_ADMIN';
      else roleScope = 'GENERAL';
    }

    const answer = await processChatMessage(userId, roleScope, message);

    res.json({
      answer,
      sessionId: sessionId || 'new-session',
      sources: []
    });

  } catch (error) {
    next(error);
  }
};
