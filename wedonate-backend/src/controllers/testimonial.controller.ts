import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTestimonials = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: testimonials });
  } catch (e) { next(e); }
};

export const getAllTestimonials = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: testimonials });
  } catch (e) { next(e); }
};

export const addTestimonial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, role, text, avatar, rating } = req.body;
    const testimonial = await prisma.testimonial.create({
      data: { id: uuidv4(), name, role, text, avatar: avatar || null, rating: rating || 5 },
    });
    res.status(201).json({ success: true, data: testimonial });
  } catch (e) { next(e); }
};

export const updateTestimonial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, role, text, avatar, rating, isActive } = req.body;
    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: { name, role, text, avatar, rating, isActive },
    });
    res.json({ success: true, data: testimonial });
  } catch (e) { next(e); }
};

export const deleteTestimonial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (e) { next(e); }
};
