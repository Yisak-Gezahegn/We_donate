import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as AuthRequest).user && ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'].includes((req as AuthRequest).user!.role);
    const faqs = await prisma.faq.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: faqs });
  } catch (error) { next(error); }
};

export const createFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { question, answer, sortOrder, isActive } = req.body;
    if (!question || !answer) return next(createError('Question and answer are required', 400));
    const faq = await prisma.faq.create({
      data: { id: uuidv4(), question, answer, sortOrder: sortOrder || 0, isActive: isActive !== false },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'CREATE_FAQ', resource: 'faq', resourceId: faq.id, details: `Created FAQ: ${question.substring(0, 50)}` },
    });
    res.status(201).json({ success: true, data: faq });
  } catch (error) { next(error); }
};

export const updateFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { question, answer, sortOrder, isActive } = req.body;
    const faq = await prisma.faq.update({
      where: { id: req.params.id },
      data: { ...(question !== undefined && { question }), ...(answer !== undefined && { answer }), ...(sortOrder !== undefined && { sortOrder }), ...(isActive !== undefined && { isActive }) },
    });
    res.json({ success: true, data: faq });
  } catch (error) { next(error); }
};

export const deleteFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'DELETE_FAQ', resource: 'faq', resourceId: req.params.id, details: 'Deleted FAQ' },
    });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) { next(error); }
};
