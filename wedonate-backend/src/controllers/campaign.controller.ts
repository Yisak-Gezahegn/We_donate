import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const ORG_ROLES = ['NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

export const createCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, category, goalAmount, imageUrl, deadline,
      telebirrAccount, cbeAccount, boaAccount, awashAccount,
      otherBankName, otherBankAccount,
      supportLetterUrl, registrationUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes,
    } = req.body;

    if (!title || !description || !category || !goalAmount)
      return next(createError('Title, description, category and goal amount are required', 400));

    if (!ORG_ROLES.includes(req.user!.role))
      return next(createError('Only organizations and admins can create campaigns', 403));

    const campaign = await prisma.campaign.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
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
        supportLetterUrl:   supportLetterUrl   || null,
        registrationUrl:    registrationUrl    || null,
        nationalIdFrontUrl: nationalIdFrontUrl || null,
        nationalIdBackUrl:  nationalIdBackUrl  || null,
        fanNumber:          fanNumber          || null,
        additionalNotes:    additionalNotes    || null,
      },
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const getActiveCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit } = req.query;
    const campaigns = await prisma.campaign.findMany({
      where: { status: { in: ['APPROVED','ACTIVE'] }, ...(category ? { category: category as string } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true, profileImage: true } },
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
    });
    // Strip admin-only fields
    const pub = campaigns.map(({ supportLetterUrl, registrationUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes, ...c }) => c);
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

    const isAdmin = req.user && ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'].includes(req.user.role);
    const isOwner = req.user && req.user.userId === campaign.userId;

    if (!isAdmin && !isOwner) {
      const { supportLetterUrl, registrationUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber, additionalNotes, ...pub } = campaign;
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

export const updateCampaignStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;
    if (status === 'REJECTED' && (!adminNote || !adminNote.trim())) {
      return next(createError('Rejection reason is required', 400));
    }
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status, adminNote: adminNote || null },
    });
    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: campaign.userId,
        title: `Campaign ${status}`,
        message: `Your campaign "${campaign.title}" has been ${status.toLowerCase()}.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: ['APPROVED','ACTIVE'].includes(status) ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO',
      },
    });
    res.json({ success: true, data: campaign });
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
      if (d.donorId !== req.user!.userId) {
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
