import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const createDonation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      amount, donationType, description, isAnonymous, currency,
      supportRequestId, campaignId,
      paymentMethod, paymentProofUrl, referenceCode,
      itemDescription, itemImageUrl, deliveryMethod,
    } = req.body;

    if (!supportRequestId && !campaignId)
      return next(createError('A support request or campaign must be specified', 400));

    const donation = await prisma.donation.create({
      data: {
        id: uuidv4(),
        donorId: req.user!.userId,
        amount:      amount      ? parseFloat(amount) : null,
        donationType: donationType || 'MONEY',
        description: description || null,
        isAnonymous: isAnonymous || false,
        currency:    currency    || 'ETB',
        paymentMethod:    paymentMethod    || null,
        paymentProofUrl:  paymentProofUrl  || null,
        referenceCode:    referenceCode    || null,
        itemDescription:  itemDescription  || null,
        itemImageUrl:     itemImageUrl     || null,
        deliveryMethod:   deliveryMethod   || null,
        supportRequestId: supportRequestId || null,
        campaignId:       campaignId       || null,
        // Non-Chapa donations start as SUCCESS if proof is provided, else PENDING
        paymentStatus: (paymentMethod && paymentMethod !== 'CHAPA' && paymentProofUrl)
          ? 'SUCCESS' : 'PENDING',
      },
    });

    // Update raised amount immediately for non-Chapa donations with proof
    if (donation.paymentStatus === 'SUCCESS' && donation.amount) {
      if (supportRequestId) {
        await prisma.supportRequest.update({
          where: { id: supportRequestId },
          data: { raisedAmount: { increment: donation.amount } },
        });
      }
      if (campaignId) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { raisedAmount: { increment: donation.amount } },
        });
      }
    }

    // Notify donor
    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        title: donation.paymentStatus === 'SUCCESS' ? 'Donation Received ✅' : 'Donation Submitted',
        message: donation.paymentStatus === 'SUCCESS'
          ? `Thank you! Your donation of ${donation.amount} ETB has been recorded.`
          : `Your donation is pending verification. Please ensure payment was sent.`,
        type: donation.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'INFO',
      },
    });

    res.status(201).json({ success: true, data: donation });
  } catch (error) { next(error); }
};

export const getDonations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip  = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        skip, take: limit,
        where: { isAnonymous: false, paymentStatus: 'SUCCESS' },
        include: { donor: { select: { firstName: true, lastName: true, profileImage: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where: { isAnonymous: false, paymentStatus: 'SUCCESS' } }),
    ]);
    res.json({ success: true, data: donations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const getDonationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id },
      include: { donor: { select: { firstName: true, lastName: true } } },
    });
    if (!donation) return next(createError('Donation not found', 404));
    res.json({ success: true, data: donation });
  } catch (error) { next(error); }
};

export const getMyDonations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: req.user!.userId },
      include: {
        supportRequest: { select: { title: true } },
        campaign:       { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: donations });
  } catch (error) { next(error); }
};

export const getDonationStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalAmountRes, totalDonations, recentDonations, fulfilledRequests] = await Promise.all([
      prisma.user.count(),
      prisma.donation.aggregate({ _sum: { amount: true }, where: { paymentStatus: 'SUCCESS' } }),
      prisma.donation.count({ where: { paymentStatus: 'SUCCESS' } }),
      prisma.donation.findMany({
        take: 6, where: { isAnonymous: false, paymentStatus: 'SUCCESS' },
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportRequest.count({ where: { status: 'FULFILLED' } }),
    ]);
    res.json({ success: true, data: { totalUsers, totalAmount: totalAmountRes._sum.amount || 0, totalDonations, recentDonations, fulfilledRequests } });
  } catch (error) { next(error); }
};
