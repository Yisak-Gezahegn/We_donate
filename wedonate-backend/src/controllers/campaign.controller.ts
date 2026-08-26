import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const ORG_ROLES = ['ORGANIZATION','CITY_ADMIN','SYSTEM_ADMIN'];
const NEED_VERIFICATION_ROLES = ['ORGANIZATION'];
const ADMIN_ROLES = ['CITY_ADMIN','SYSTEM_ADMIN'];

export const createCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, category, goalAmount, imageUrl, deadline,
      telebirrAccount, cbeAccount, boaAccount, awashAccount,
      otherBankName, otherBankAccount,
      requesterPhone,
      supportLetterUrl, additionalNotes,
      // Admin can create on behalf of another user
      targetUserId,
    } = req.body;

    if (!title || !description || !category || !goalAmount)
      return next(createError('Title, description, category and goal amount are required', 400));

    const isAdmin = ADMIN_ROLES.includes(req.user!.role);
    const effectiveUserId = (isAdmin && targetUserId) ? targetUserId : req.user!.userId;

    if (!isAdmin && !ORG_ROLES.includes(req.user!.role))
      return next(createError('Only organizations and admins can create campaigns', 403));

    if (!isAdmin && NEED_VERIFICATION_ROLES.includes(req.user!.role)) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { verificationStatus: true },
      });
      if (!currentUser || currentUser.verificationStatus !== 'VERIFIED') {
        return next(createError('Your organization must be verified by an admin before you can create campaigns. Please wait for verification.', 403));
      }
    }

    if (isAdmin && targetUserId) {
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
      if (!targetUser) return next(createError('Target user not found', 404));
    }

    const campaign = await prisma.campaign.create({
      data: {
        id: uuidv4(), userId: effectiveUserId,
        title, description, category,
        goalAmount: parseFloat(goalAmount),
        imageUrl: imageUrl || null,
        deadline: deadline ? new Date(deadline) : null,
        telebirrAccount: telebirrAccount || null,
        cbeAccount: cbeAccount || null,
        boaAccount: boaAccount || null,
        awashAccount: awashAccount || null,
        otherBankName: otherBankName || null,
        otherBankAccount: otherBankAccount || null,
        requesterPhone: requesterPhone || null,
        supportLetterUrl: supportLetterUrl || null,
        additionalNotes: additionalNotes || null,
        status: 'PENDING_REVIEW',
      },
    });

    if (isAdmin && targetUserId) {
      await prisma.auditLog.create({
        data: {
          id: uuidv4(), userId: req.user!.userId, action: 'CREATE_CAMPAIGN',
          resource: 'campaign', resourceId: campaign.id,
          details: `Created campaign "${title}" on behalf of user ${targetUserId}`,
        },
      });
    }

    // Notify City Admins of new campaign
    const cityAdmins = await prisma.user.findMany({ where: { role: 'CITY_ADMIN' } });
    if (cityAdmins.length > 0) {
      await prisma.notification.createMany({
        data: cityAdmins.map(admin => ({
          id: uuidv4(), userId: admin.id,
          title: 'New Campaign Pending Review',
          message: `A new campaign "${title}" has been submitted for approval.`,
          type: 'INFO',
        })),
      });
    }

    res.status(201).json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const getActiveCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit } = req.query;
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'PUBLISHED', ...(category ? { category: category as string } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true, profileImage: true } },
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
    });
    // Strip admin-only fields
    const pub = campaigns.map(({ supportLetterUrl, additionalNotes, ...c }) => c);
    res.json({ success: true, data: pub });
  } catch (error) { next(error); }
};

export const getCampaignById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true } },
        donations: {
          include: { donor: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }, take: 10,
        },
        _count: { select: { donations: true } },
      },
    });
    if (!campaign) return next(createError('Campaign not found', 404));

    const isAdmin = req.user && ['CITY_ADMIN','SYSTEM_ADMIN'].includes(req.user.role);
    const isOwner = req.user && req.user.userId === campaign.userId;

    if (!isAdmin && !isOwner) {
      const { supportLetterUrl, additionalNotes, ...pub } = campaign;
      return res.json({ success: true, data: pub });
    }
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const getMyCampaigns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: campaigns });
  } catch (error) { next(error); }
};

export const getAllCampaigns = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: campaigns });
  } catch (error) { next(error); }
};

// Admin — safely archive a campaign
export const deleteCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { userId: true, title: true },
    });
    if (!campaign) return next(createError('Campaign not found', 404));

    await prisma.campaign.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: campaign.userId,
        title: 'Campaign Archived',
        message: `Your campaign "${campaign.title}" was archived by an administrator.`,
        type: 'ERROR',
      },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'ARCHIVE_CAMPAIGN',
        resource: 'campaign', resourceId: id,
        details: `Archived campaign "${campaign.title}" of user ${campaign.userId}`,
      },
    });

    res.json({ success: true, message: 'Campaign archived successfully' });
  } catch (error) { next(error); }
};

export const updateCampaignStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;
    
    const validStatuses = ['PENDING_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED', 'COMPLETED', 'REJECTED', 'SUSPENDED', 'CANCELLED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return next(createError(`Invalid status: ${status}`, 400));
    }

    if (status === 'REJECTED' && (!adminNote || !adminNote.trim())) {
      return next(createError('Rejection reason is required', 400));
    }
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
    });
    if (!campaign) return next(createError('Campaign not found', 404));

    // Anti-self-approval rule
    if (['PUBLISHED', 'COMPLETED', 'REJECTED'].includes(status) && campaign.userId === req.user!.userId) {
      return next(createError('Conflict of Interest: You cannot approve or reject a campaign you created', 403));
    }

    const dataToUpdate: any = { status, adminNote: adminNote || null };
    if (status === 'PUBLISHED') {
      dataToUpdate.isPublished = true;
      dataToUpdate.publishedAt = new Date();
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });
    
    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: updatedCampaign.userId,
        title: `Campaign ${status}`,
        message: `Your campaign "${updatedCampaign.title}" has been ${status.replace(/_/g, ' ').toLowerCase()}.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: ['PUBLISHED','COMPLETED'].includes(status) ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO',
      },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: `CAMPAIGN_${status}`,
        resource: 'campaign', resourceId: updatedCampaign.id,
        details: `Updated campaign status to ${status}${adminNote ? ` with note: ${adminNote}` : ''}`,
      },
    });
    res.json({ success: true, data: updatedCampaign });
  } catch (error) { next(error); }
};

export const submitSuccessPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { successPhotoUrl, successNote } = req.body;

    if (!successPhotoUrl) return next(createError('Success photo URL is required', 400));

    const campaign = await prisma.campaign.findUnique({ where: { id }, select: { userId: true, goalAmount: true, raisedAmount: true, status: true } });
    if (!campaign) return next(createError('Campaign not found', 404));
    if (campaign.userId !== req.user!.userId) return next(createError('Only the campaign creator can submit success photos', 403));

    const updated = await prisma.campaign.update({
      where: { id },
      data: { successPhotoUrl, successNote: successNote || null, status: 'COMPLETED' },
    });

    const donors = await prisma.donation.findMany({
      where: { campaignId: id, paymentStatus: 'SUCCESS' },
      select: { donorId: true },
      distinct: ['donorId'],
    });
    for (const d of donors) {
      if (d.donorId && d.donorId !== req.user!.userId) {
        await prisma.notification.create({
          data: {
            id: uuidv4(), userId: d.donorId,
            title: 'Campaign Completed 🎉',
            message: `A campaign you supported has been completed! Check out the impact photo.`,
            type: 'SUCCESS',
          },
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};
