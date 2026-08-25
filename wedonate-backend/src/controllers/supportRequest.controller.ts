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
      supportLetterUrl, additionalNotes,
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
        const msg = req.user!.role === 'USER' 
          ? 'Your account must be verified before you can request support.'
          : 'Your organization must be verified by an admin before you can create support requests. Please wait for verification.';
        return next(createError(msg, 403));
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
        additionalNotes:    additionalNotes    || null,
        kebeleId: kebeleId || 'UNASSIGNED',
        source: (isAdmin && targetUserId) ? 'ASSISTED' : 'SELF_SERVICE',
        createdById: (isAdmin && targetUserId) ? req.user!.userId : null,
        status: (isAdmin && targetUserId) ? 'PENDING_CITY_APPROVAL' : 'PENDING_REVIEW',
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
      // Notify City Admins of a new Assisted request pending review
      const cityAdmins = await prisma.user.findMany({ where: { role: 'CITY_ADMIN' } });
      if (cityAdmins.length > 0) {
        await prisma.notification.createMany({
          data: cityAdmins.map(admin => ({
            id: uuidv4(), userId: admin.id,
            title: 'Assisted Request Submitted',
            message: `Kebele Admin submitted an assisted request "${title}" pending your review.`,
            type: 'INFO',
          })),
        });
      }
    } else {
      // Notify Kebele Admins of a new self-service request
      const kebeleAdmins = await prisma.user.findMany({ where: { role: 'KEBELE_ADMIN', kebeleId } });
      if (kebeleAdmins.length > 0) {
        await prisma.notification.createMany({
          data: kebeleAdmins.map(admin => ({
            id: uuidv4(), userId: admin.id,
            title: 'New Support Request',
            message: `A new support request "${title}" was submitted in your Kebele.`,
            type: 'INFO',
          })),
        });
      }
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
    const publicRequests = requests.map(({ supportLetterUrl, additionalNotes, ...r }) => r);
    res.json({ success: true, data: publicRequests });
  } catch (error) { next(error); }
};

// Admin — full details including support letter
export const getAllRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let where: any = {};
    if (req.user!.role === 'KEBELE_ADMIN') {
      where.kebeleId = req.user!.kebeleId || 'UNASSIGNED';
    } else if (req.user!.role === 'CITY_ADMIN') {
      // City Admin can see all requests
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
      const { supportLetterUrl, additionalNotes, ...publicData } = request;
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
      select: { userId: true, title: true, kebeleId: true, createdById: true },
    });
    if (!request) return next(createError('Request not found', 404));

    if (req.user!.role === 'KEBELE_ADMIN' && request.kebeleId !== req.user!.kebeleId) {
      return next(createError('Unauthorized to archive this Kebele\'s request', 403));
    }

    await prisma.supportRequest.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    const notifications = [{
      id: uuidv4(), userId: request.userId,
      title: 'Request Archived',
      message: `Your support request "${request.title}" was archived by an administrator.`,
      type: 'ERROR' as any,
    }];
    
    if (request.createdById && request.createdById !== request.userId) {
      notifications.push({
        id: uuidv4(), userId: request.createdById,
        title: 'Assisted Request Archived',
        message: `The support request "${request.title}" you created on behalf of a citizen was archived by an administrator.`,
        type: 'ERROR' as any,
      });
    }

    await prisma.notification.createMany({ data: notifications });

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

    const role = req.user!.role;
    
    // Kebele Admin scope check
    if (role === 'KEBELE_ADMIN') {
      if (request.kebeleId !== req.user!.kebeleId) {
        return next(createError('Unauthorized to modify this Kebele\'s request', 403));
      }
      if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status)) {
        return next(createError('Kebele Admin can only approve, reject or request changes', 403));
      }
      if (request.source === 'ASSISTED') {
        return next(createError('Assisted requests must be approved by City Admin', 403));
      }
    }
    
    // City Admin scope check
    if (role === 'CITY_ADMIN') {
      if (!['APPROVED', 'PUBLISHED', 'REJECTED', 'FULFILLED', 'CHANGES_REQUESTED'].includes(status)) {
        return next(createError('Invalid status transition for City Admin', 403));
      }
    }

    // Anti-self-approval rule
    if (['APPROVED', 'PUBLISHED', 'FULFILLED', 'REJECTED'].includes(status) && (request.createdById === req.user!.userId || request.userId === req.user!.userId)) {
      if (role !== 'SYSTEM_ADMIN') { // System Admin can override
        return next(createError('Conflict of Interest: You cannot approve or reject a request you created', 403));
      }
    }

    const updatedRequest = await prisma.supportRequest.update({
      where: { id: req.params.id },
      data: { 
        status, 
        adminNote: adminNote || null,
        ...(status === 'PUBLISHED' ? { isPublished: true, publishedAt: new Date() } : {})
      },
    });

    const notifications = [{
      id: uuidv4(), userId: updatedRequest.userId,
      title: `Request ${status}`,
      message: `Your support request "${updatedRequest.title}" has been ${status.toLowerCase()}.${adminNote ? ` Reason: ${adminNote}` : ''}`,
      type: (status === 'PUBLISHED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO') as any,
    }];
    
    if (updatedRequest.createdById && updatedRequest.createdById !== updatedRequest.userId) {
        let assistedMsg = `The support request "${updatedRequest.title}" you created on behalf of a citizen has been ${status.toLowerCase()}.`;
        if (role === 'CITY_ADMIN') {
          if (status === 'APPROVED') assistedMsg = `Assisted request "${updatedRequest.title}" was approved by City Administration.`;
          else if (status === 'REJECTED') assistedMsg = `Assisted request "${updatedRequest.title}" was rejected.`;
          else if (status === 'CHANGES_REQUESTED') assistedMsg = `City Administration requested changes to the assisted request "${updatedRequest.title}".`;
        }
        
        notifications.push({
          id: uuidv4(), userId: updatedRequest.createdById,
          title: `Assisted Request ${status}`,
          message: `${assistedMsg}${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: (status === 'PUBLISHED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO') as any,
      });
    }

    await prisma.notification.createMany({ data: notifications });
    
    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'UPDATE_REQUEST_STATUS',
        resource: 'support_request', resourceId: req.params.id,
        details: `Changed request status to ${status}. Note: ${adminNote || 'None'}`
      }
    });

    res.json({ success: true, data: updatedRequest, message: `Status updated to ${status}` });
  } catch (error) { next(error); }
};
