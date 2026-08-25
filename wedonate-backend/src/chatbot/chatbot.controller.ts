import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { processChatMessage } from './chatbot.service';
import { RoleScope } from './chatbot.types';
import prisma from '../lib/prisma';

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

    if (req.user) {
      await prisma.chatMessage.createMany({
        data: [
          { userId, text: message, isUser: true },
          { userId, text: answer, isUser: false }
        ]
      });
    }

    res.json({
      answer,
      sessionId: sessionId || 'new-session',
      sources: []
    });

  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.userId },
      orderBy: { timestamp: 'asc' },
      take: 100
    });
    
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const clearChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    await prisma.chatMessage.deleteMany({
      where: { userId: req.user.userId }
    });
    
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    next(error);
  }
};
