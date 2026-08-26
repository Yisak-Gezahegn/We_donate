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
      guestName, guestEmail, guestPhone,
    } = req.body;

    if (!supportRequestId && !campaignId)
      return next(createError('A support request or campaign must be specified', 400));

    if (donationType === 'MONEY' && paymentMethod && paymentMethod !== 'CHAPA') {
      if (!referenceCode || !referenceCode.trim()) {
        return next(createError('Bank Reference Number is required for manual bank transfers', 400));
      }
    }

    // Check if goal is already reached
    if (supportRequestId) {
      const sr = await prisma.supportRequest.findUnique({
        where: { id: supportRequestId },
        select: { goalAmount: true, raisedAmount: true, status: true },
      });
      if (!sr) return next(createError('Support request not found', 404));
      if (sr.status === 'FULFILLED' || sr.status === 'COMPLETED' as any)
        return next(createError('This support request has been completed and is no longer accepting donations', 400));
      if (sr.goalAmount && sr.raisedAmount >= sr.goalAmount)
        return next(createError('The fundraising goal for this request has been reached', 400));
    }
    if (campaignId) {
      const camp = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { goalAmount: true, raisedAmount: true, status: true },
      });
      if (!camp) return next(createError('Campaign not found', 404));
      if (camp.status === 'COMPLETED')
        return next(createError('This campaign has been completed and is no longer accepting donations', 400));
      if (camp.raisedAmount >= camp.goalAmount)
        return next(createError('The fundraising goal for this campaign has been reached', 400));
    }

    const isGuest = !req.user;
    
    const donation = await prisma.donation.create({
      data: {
        id: uuidv4(),
        donorId: req.user ? req.user.userId : null,
        guestName: isGuest ? guestName : null,
        guestEmail: isGuest ? guestEmail : null,
        guestPhone: isGuest ? guestPhone : null,
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
        // Manual donations must be verified by admin. Auto-payment (Chapa) is handled via webhook.
        paymentStatus: 'PENDING',
      },
    });

    // Update raised amount immediately for non-Chapa donations with proof
    if (donation.paymentStatus === 'SUCCESS' && donation.amount) {
      if (supportRequestId) {
        const updated = await prisma.supportRequest.update({
          where: { id: supportRequestId },
          data: { raisedAmount: { increment: donation.amount } },
        });
        if (updated.goalAmount && updated.raisedAmount >= updated.goalAmount) {
          await prisma.supportRequest.update({
            where: { id: supportRequestId },
            data: { status: 'FULFILLED' },
          });
        }
      }
      if (campaignId) {
        const updated = await prisma.campaign.update({
          where: { id: campaignId },
          data: { raisedAmount: { increment: donation.amount } },
        });
        if (updated.raisedAmount >= updated.goalAmount) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' },
          });
        }
      }
    }

    // Notify donor (if not guest)
    if (!isGuest) {
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
    }

    // Only notify beneficiary immediately if payment is already successful
    let beneficiaryId: string | null = null;
    let createdById: string | null = null;
    if (donation.paymentStatus === 'SUCCESS') {
      if (campaignId) {
        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { userId: true } });
        beneficiaryId = campaign?.userId ?? null;
      } else if (supportRequestId) {
        const req2 = await prisma.supportRequest.findUnique({ where: { id: supportRequestId }, select: { userId: true, createdById: true } });
        beneficiaryId = req2?.userId ?? null;
        createdById = req2?.createdById ?? null;
      }
      
      
      const donorName = isAnonymous ? 'Anonymous' : (isGuest ? (guestName || 'A guest') : (await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true } }))?.firstName ?? 'Someone');
      
      if (beneficiaryId && (!req.user || beneficiaryId !== req.user.userId)) {
        await prisma.notification.create({
          data: {
            id: uuidv4(), userId: beneficiaryId,
            title: 'New Verified Donation 💰',
            message: `${donorName} has made a verified donation of${donation.amount ? ` ${donation.amount} ETB` : ' items'} to your ${campaignId ? 'campaign' : 'support request'}.`,
            type: 'SUCCESS',
          },
        });
      } else if (!beneficiaryId && createdById) {
        // Assisted Request -> Kebele Admin gets notified
        await prisma.notification.create({
          data: {
            id: uuidv4(), userId: createdById,
            title: 'New Verified Donation (Assisted Request) 💰',
            message: `${donorName} has made a verified donation of${donation.amount ? ` ${donation.amount} ETB` : ' items'} to an assisted support request you submitted.`,
            type: 'SUCCESS',
          },
        });
      }
    }

    // Notify appropriate admin for verification if pending
    if (donation.paymentStatus === 'PENDING') {
      const donorName = isAnonymous ? 'Anonymous Donor' : (isGuest ? (guestName || 'Guest Donor') : (await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true } }))?.firstName || 'Someone');
      
      if (campaignId) {
        const cityAdmins = await prisma.user.findMany({ where: { role: 'CITY_ADMIN' } });
        if (cityAdmins.length > 0) {
          await prisma.notification.createMany({
            data: cityAdmins.map(admin => ({
              id: uuidv4(), userId: admin.id,
              title: donationType === 'MONEY' ? 'Donation Pending Verification' : 'New Item Donation',
              message: donationType === 'MONEY'
                ? `A donation of ${amount} ETB by ${donorName} (Ref: ${referenceCode || 'N/A'}) requires your verification for an Organization Campaign.`
                : `A new item donation by ${donorName} requires coordination for an Organization Campaign.`,
              type: 'INFO',
            })),
          });
        }
      } else if (supportRequestId) {
        const sr = await prisma.supportRequest.findUnique({ where: { id: supportRequestId }, select: { kebeleId: true } });
        if (sr && sr.kebeleId && sr.kebeleId !== 'UNASSIGNED') {
          const kebeleAdmins = await prisma.user.findMany({ where: { role: 'KEBELE_ADMIN', kebeleId: sr.kebeleId } });
          if (kebeleAdmins.length > 0) {
            await prisma.notification.createMany({
              data: kebeleAdmins.map(admin => ({
                id: uuidv4(), userId: admin.id,
                title: donationType === 'MONEY' ? 'Donation Pending Verification' : 'New Item Donation',
                message: donationType === 'MONEY'
                  ? `A donation of ${amount} ETB by ${donorName} (Ref: ${referenceCode || 'N/A'}) requires your verification for a Kebele Support Request.`
                  : `A new item donation by ${donorName} requires coordination for a Kebele Support Request.`,
                type: 'INFO',
              })),
            });
          }
        }
      }
    }

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
        donor: { select: { firstName: true, lastName: true } },
        supportRequest: { select: { title: true, user: { select: { firstName: true, lastName: true } } } },
        campaign:       { select: { title: true, user: { select: { orgName: true, firstName: true, lastName: true } } } },
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
