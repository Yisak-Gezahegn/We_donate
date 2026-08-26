import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUpdatesByCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const updates = await prisma.campaignUpdate.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: updates });
  } catch (error) { next(error); }
};

export const createUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const { title, content, imageUrl } = req.body;

    if (!title || !content) return next(createError('Title and content are required', 400));

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { userId: true } });
    if (!campaign) return next(createError('Campaign not found', 404));
    if (campaign.userId !== req.user!.userId) return next(createError('Only the campaign creator can post updates', 403));

    const update = await prisma.campaignUpdate.create({
      data: {
        id: uuidv4(),
        campaignId,
        title,
        content,
        imageUrl: imageUrl || null,
      },
    });

    // Notify donors who donated to this campaign
    const donors = await prisma.donation.findMany({
      where: { campaignId, paymentStatus: 'SUCCESS' },
      select: { donorId: true },
      distinct: ['donorId'],
    });
    for (const d of donors) {
      if (d.donorId && d.donorId !== req.user!.userId) {
        await prisma.notification.create({
          data: {
            id: uuidv4(), userId: d.donorId,
            title: 'Campaign Update 📢',
            message: `A new update has been posted on a campaign you supported: "${title}"`,
            type: 'INFO',
          },
        });
      }
    }

    res.status(201).json({ success: true, data: update });
  } catch (error) { next(error); }
};

export const deleteUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const update = await prisma.campaignUpdate.findUnique({ where: { id }, select: { campaign: { select: { userId: true } } } });
    if (!update) return next(createError('Update not found', 404));
    if (update.campaign.userId !== req.user!.userId) return next(createError('Not authorized', 403));
    await prisma.campaignUpdate.delete({ where: { id } });
    res.json({ success: true, message: 'Update deleted' });
  } catch (error) { next(error); }
};
