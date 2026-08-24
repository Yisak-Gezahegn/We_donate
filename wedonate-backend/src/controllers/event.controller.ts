import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as AuthRequest).user && ['CITY_ADMIN','SYSTEM_ADMIN'].includes((req as AuthRequest).user!.role);
    const { status } = req.query;
    const events = await prisma.event.findMany({
      where: isAdmin
        ? (status ? { status: status as any } : {})
        : { status: 'PUBLISHED' },
      orderBy: { startDate: 'desc' },
    });
    res.json({ success: true, data: events });
  } catch (error) { next(error); }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return next(createError('Event not found', 404));
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, location, startDate, endDate, imageUrl, status } = req.body;
    if (!title || !description || !startDate || !endDate) return next(createError('Title, description, start and end dates are required', 400));
    const event = await prisma.event.create({
      data: {
        id: uuidv4(), title, description,
        location: location || null,
        startDate: new Date(startDate), endDate: new Date(endDate),
        imageUrl: imageUrl || null, status: status || 'DRAFT',
      },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'CREATE_EVENT', resource: 'event', resourceId: event.id, details: `Created event: ${title}` },
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, location, startDate, endDate, imageUrl, status } = req.body;
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status !== undefined && { status }),
      },
    });
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'DELETE_EVENT', resource: 'event', resourceId: req.params.id, details: 'Deleted event' },
    });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
};
