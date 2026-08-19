import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const ADMIN_ROLES = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

export const createRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, category, urgencyLevel,
      goalAmount, imageUrl, location, familySize,
      // Payment accounts
      telebirrAccount, cbeAccount, boaAccount, awashAccount,
      otherBankName, otherBankAccount,
      // Admin-only docs
      supportLetterUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes,
    } = req.body;

    if (!title || !description || !category)
      return next(createError('Title, description and category are required', 400));

    const request = await prisma.supportRequest.create({
      data: {
        id: uuidv4(),
        userId: req.user!.userId,
        title, description, category,
        urgencyLevel: urgencyLevel ? parseInt(urgencyLevel) : 1,
        goalAmount:   goalAmount  ? parseFloat(goalAmount)  : null,
        familySize:   familySize  ? parseInt(familySize)    : 1,
        imageUrl:     imageUrl    || null,
        location:     location    || null,
        telebirrAccount:  telebirrAccount  || null,
        cbeAccount:       cbeAccount       || null,
        boaAccount:       boaAccount       || null,
        awashAccount:     awashAccount     || null,
        otherBankName:    otherBankName    || null,
        otherBankAccount: otherBankAccount || null,
        supportLetterUrl:   supportLetterUrl   || null,
        nationalIdFrontUrl: nationalIdFrontUrl || null,
        nationalIdBackUrl:  nationalIdBackUrl  || null,
        fanNumber:          fanNumber          || null,
        additionalNotes:    additionalNotes    || null,
      },
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
};

// Public — approved requests (donors can see payment accounts)
export const getApprovedRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit } = req.query;
    const requests = await prisma.supportRequest.findMany({
      where: { status: 'APPROVED', ...(category ? { category: category as any } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true, profileImage: true } },
        _count: { select: { donations: true } },
      },
      orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'desc' }],
      take: limit ? parseInt(limit as string) : undefined,
      // Omit admin-only fields from public response
    });
    // Strip admin-only fields from public view
    const publicRequests = requests.map(({ supportLetterUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes, ...r }) => r);
    res.json({ success: true, data: publicRequests });
  } catch (error) { next(error); }
};

// Admin — full details including support letter
export const getAllRequests = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.supportRequest.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true } },
        _count: { select: { donations: true } },
      },
      orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
};

// Single request — full details for admin, partial for others
export const getRequestById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.supportRequest.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true } },
        donations: {
          include: { donor: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { donations: true } },
      },
    });
    if (!request) return next(createError('Request not found', 404));

    const isAdmin = req.user && ADMIN_ROLES.includes(req.user.role);
    const isOwner = req.user && req.user.userId === request.userId;

    // Strip admin-only fields for non-admin, non-owner
    if (!isAdmin && !isOwner) {
      const { supportLetterUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes, ...publicData } = request;
      return res.json({ success: true, data: publicData });
    }
    res.json({ success: true, data: request });
  } catch (error) { next(error); }
};

export const getMyRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.supportRequest.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;
    if (status === 'REJECTED' && (!adminNote || !adminNote.trim())) {
      return next(createError('Rejection reason is required', 400));
    }
    const request = await prisma.supportRequest.update({
      where: { id: req.params.id },
      data: { status, adminNote: adminNote || null },
    });
    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: request.userId,
        title: `Request ${status}`,
        message: `Your support request "${request.title}" has been ${status.toLowerCase()}.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO',
      },
    });
    res.json({ success: true, data: request, message: 'Status updated' });
  } catch (error) { next(error); }
};
