import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as AuthRequest).user && ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'].includes((req as AuthRequest).user!.role);
    const news = await prisma.news.findMany({
      where: isAdmin ? {} : { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: news });
  } catch (error) { next(error); }
};

export const getNewsById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await prisma.news.findUnique({ where: { id: req.params.id } });
    if (!article) return next(createError('News not found', 404));
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
};

export const createNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, imageUrl, isPublished } = req.body;
    if (!title || !content) return next(createError('Title and content are required', 400));
    const article = await prisma.news.create({
      data: { id: uuidv4(), title, content, imageUrl: imageUrl || null, isPublished: isPublished || false },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'CREATE_NEWS', resource: 'news', resourceId: article.id, details: `Created news: ${title}` },
    });
    res.status(201).json({ success: true, data: article });
  } catch (error) { next(error); }
};

export const updateNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, imageUrl, isPublished } = req.body;
    const article = await prisma.news.update({
      where: { id: req.params.id },
      data: { ...(title !== undefined && { title }), ...(content !== undefined && { content }), ...(imageUrl !== undefined && { imageUrl }), ...(isPublished !== undefined && { isPublished }) },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'UPDATE_NEWS', resource: 'news', resourceId: req.params.id, details: `Updated news: ${article.title}` },
    });
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
};

export const deleteNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.news.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'DELETE_NEWS', resource: 'news', resourceId: req.params.id, details: 'Deleted news article' },
    });
    res.json({ success: true, message: 'News deleted' });
  } catch (error) { next(error); }
};
