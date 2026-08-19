import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getHeroImages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const images = await prisma.heroImage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: images });
  } catch (e) { next(e); }
};

export const getAllHeroImages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const images = await prisma.heroImage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: images });
  } catch (e) { next(e); }
};

export const addHeroImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, caption, sortOrder } = req.body;
    const image = await prisma.heroImage.create({
      data: { id: uuidv4(), imageUrl, caption, sortOrder: sortOrder || 0 },
    });
    res.status(201).json({ success: true, data: image });
  } catch (e) { next(e); }
};

export const updateHeroImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, caption, sortOrder, isActive } = req.body;
    const image = await prisma.heroImage.update({
      where: { id: req.params.id },
      data: { imageUrl, caption, sortOrder, isActive },
    });
    res.json({ success: true, data: image });
  } catch (e) { next(e); }
};

export const deleteHeroImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.heroImage.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Hero image deleted' });
  } catch (e) { next(e); }
};
