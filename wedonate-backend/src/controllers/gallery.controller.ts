import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getGallery = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const photos = await prisma.galleryPhoto.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: photos });
  } catch (e) { next(e); }
};

export const addPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, title, description } = req.body;
    const photo = await prisma.galleryPhoto.create({
      data: { id: uuidv4(), imageUrl, title, description: description || null, uploadedBy: req.user!.userId },
    });
    res.status(201).json({ success: true, data: photo });
  } catch (e) { next(e); }
};

export const deletePhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.galleryPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Photo deleted' });
  } catch (e) { next(e); }
};
