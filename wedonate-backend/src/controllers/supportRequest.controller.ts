import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const ADMIN_ROLES = ['KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'];
const NEED_VERIFICATION_ROLES = ['ORGANIZATION', 'USER'];

export const createRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, category, urgencyLevel,
      goalAmount, imageUrl, location, familySize,
      // Payment accounts
      telebirrAccount, cbeAccount, boaAccount, awashAccount,
      otherBankName, otherBankAccount,
      requesterPhone,
      // Admin-only docs
      supportLetterUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes,
      // Admin can create on behalf of another user
      targetUserId,
    } = req.body;

    if (!title || !description || !category)
      return next(createError('Title, description and category are required', 400));

    const isAdmin = ADMIN_ROLES.includes(req.user!.role);
    const effectiveUserId = (isAdmin && targetUserId) ? targetUserId : req.user!.userId;

    if (!isAdmin && NEED_VERIFICATION_ROLES.includes(req.user!.role)) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { verificationStatus: true },
      });
      if (!currentUser || currentUser.verificationStatus !== 'VERIFIED') {
        return next(createError('Your organization must be verified by an admin before you can create support requests. Please wait for verification.', 403));
      }
    }

    let kebeleId: string | null = null;
    if (isAdmin && targetUserId) {
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, kebeleId: true } });
      if (!targetUser) return next(createError('Target user not found', 404));
      kebeleId = targetUser.kebeleId;
    } else {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { kebeleId: true } });
      kebeleId = currentUser?.kebeleId || null;
    }

    const request = await prisma.supportRequest.create({
      data: {
        id: uuidv4(),
        userId: effectiveUserId,
        title, description, category,
        urgencyLevel: urgencyLevel ? parseInt(urgencyLevel) : 1,
        goalAmount: goalAmount ? parseFloat(goalAmount) : null,
        familySize: familySize ? parseInt(familySize) : 1,
        imageUrl: imageUrl || null,
        location: location || null,
        telebirrAccount: telebirrAccount || null,
        cbeAccount: cbeAccount || null,
        boaAccount: boaAccount || null,
        awashAccount: awashAccount || null,
        otherBankName: otherBankName || null,
        otherBankAccount: otherBankAccount || null,
        requesterPhone: requesterPhone || null,
        supportLetterUrl: supportLetterUrl || null,
        nationalIdFrontUrl: nationalIdFrontUrl || null,
        nationalIdBackUrl:  nationalIdBackUrl  || null,
        fanNumber:          fanNumber          || null,
        additionalNotes:    additionalNotes    || null,
        kebeleId: kebeleId || 'UNASSIGNED',
        source: (isAdmin && targetUserId) ? 'ASSISTED' : 'SELF_SERVICE',
        createdById: (isAdmin && targetUserId) ? req.user!.userId : null,
      },
    });

    if (isAdmin && targetUserId) {
      await prisma.auditLog.create({
        data: {
          id: uuidv4(), userId: req.user!.userId, action: 'CREATE_SUPPORT_REQUEST',
          resource: 'support_request', resourceId: request.id,
          details: `Created support request "${title}" on behalf of user ${targetUserId}`,
        },
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
};

// Public — approved requests (donors can see payment accounts)
export const getApprovedRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit } = req.query;
    const requests = await prisma.supportRequest.findMany({
      where: { status: 'PUBLISHED', ...(category ? { category: category as any } : {}) },
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
export const getAllRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let where: any = {};
    if (req.user!.role === 'KEBELE_ADMIN') {
      where.kebeleId = req.user!.kebeleId || 'UNASSIGNED'; // strict kebele scoping
    }
    const requests = await prisma.supportRequest.findMany({
      where,
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

    if (!isAdmin && !isOwner) {
      const { supportLetterUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes, ...publicData } = request;
      return res.json({ success: true, data: publicData });
    }
    
    // Kebele scope check for admins
    if (isAdmin && req.user!.role === 'KEBELE_ADMIN' && request.kebeleId !== req.user!.kebeleId) {
      return next(createError('Unauthorized to view this Kebele\'s request details', 403));
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

// Admin — safely archive a support request
export const deleteRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await prisma.supportRequest.findUnique({
      where: { id },
      select: { userId: true, title: true, kebeleId: true },
    });
    if (!request) return next(createError('Request not found', 404));

    if (req.user!.role === 'KEBELE_ADMIN' && request.kebeleId !== req.user!.kebeleId) {
      return next(createError('Unauthorized to archive this Kebele\'s request', 403));
    }

    await prisma.supportRequest.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: request.userId,
        title: 'Request Archived',
        message: `Your support request "${request.title}" was archived by an administrator.`,
        type: 'ERROR',
      },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'ARCHIVE_SUPPORT_REQUEST',
        resource: 'support_request', resourceId: id,
        details: `Archived support request "${request.title}" of user ${request.userId}`,
      },
    });

    res.json({ success: true, message: 'Support request archived successfully' });
  } catch (error) { next(error); }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;
    if (status === 'REJECTED' && (!adminNote || !adminNote.trim())) {
      return next(createError('Rejection reason is required', 400));
    }
    
    const request = await prisma.supportRequest.findUnique({
      where: { id: req.params.id },
    });
    if (!request) return next(createError('Request not found', 404));

    if (req.user!.role === 'KEBELE_ADMIN' && request.kebeleId !== req.user!.kebeleId) {
      return next(createError('Unauthorized to modify this Kebele\'s request', 403));
    }

    // Anti-self-approval rule
    if (['PUBLISHED', 'FULFILLED', 'REJECTED'].includes(status) && (request.createdById === req.user!.userId || request.userId === req.user!.userId)) {
      return next(createError('Conflict of Interest: You cannot approve or reject a request you created', 403));
    }

    const updatedRequest = await prisma.supportRequest.update({
      where: { id: req.params.id },
      data: { status, adminNote: adminNote || null },
    });
    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: updatedRequest.userId,
        title: `Request ${status}`,
        message: `Your support request "${updatedRequest.title}" has been ${status.toLowerCase()}.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: status === 'PUBLISHED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO',
      },
    });
    res.json({ success: true, data: updatedRequest, message: 'Status updated' });
  } catch (error) { next(error); }
};
