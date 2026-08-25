import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';

export const getActiveKebeles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const kebeles = await prisma.kebele.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    res.json(kebeles);
  } catch (error) {
    next(error);
  }
};

export const getAllKebeles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const kebeles = await prisma.kebele.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } }
    });
    res.json(kebeles);
  } catch (error) {
    next(error);
  }
};

export const createKebele = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, status } = req.body;
    if (!name) return next(createError('Name is required', 400));
    const kebele = await prisma.kebele.create({
      data: { name, status: status || 'ACTIVE' }
    });
    res.status(201).json(kebele);
  } catch (error: any) {
    if (error.code === 'P2002') return next(createError('Kebele already exists', 400));
    next(error);
  }
};

export const updateKebele = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const kebele = await prisma.kebele.update({
      where: { id },
      data: { name, status }
    });
    res.json(kebele);
  } catch (error) {
    next(error);
  }
};
