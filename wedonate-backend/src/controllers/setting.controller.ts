import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getSettings = async (_req: any, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.siteSetting.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.siteSetting.create({ data: { id: 'singleton' } });
    }
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { contactEmail, contactPhone, address, facebookUrl, twitterUrl, instagramUrl, telegramUrl, missionStatement, aboutText } = req.body;
    let settings = await prisma.siteSetting.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.siteSetting.create({ data: { id: 'singleton' } });
    }
    const updated = await prisma.siteSetting.update({
      where: { id: 'singleton' },
      data: {
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(address !== undefined && { address }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(telegramUrl !== undefined && { telegramUrl }),
        ...(missionStatement !== undefined && { missionStatement }),
        ...(aboutText !== undefined && { aboutText }),
      },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'UPDATE_SETTINGS', resource: 'site_setting', details: 'Updated site settings' },
    });
    res.json({ success: true, data: updated, message: 'Settings updated' });
  } catch (error) { next(error); }
};
