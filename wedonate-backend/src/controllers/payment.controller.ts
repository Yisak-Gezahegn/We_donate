import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const CHAPA_BASE_URL    = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY  = process.env.CHAPA_SECRET_KEY!;

export const initializePayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, currency, donationType, description, isAnonymous, supportRequestId, campaignId } = req.body;

    if (!amount || parseFloat(amount) < 1)
      return next(createError('Amount must be at least 1 ETB', 400));
    if (!supportRequestId && !campaignId)
      return next(createError('A support request or campaign must be specified', 400));

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return next(createError('User not found', 404));

    // Validate target exists and is approved
    if (supportRequestId) {
      const req_ = await prisma.supportRequest.findUnique({ where: { id: supportRequestId } });
      if (!req_ || req_.status !== 'APPROVED')
        return next(createError('Support request not found or not approved', 404));
    }
    if (campaignId) {
      const camp = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!camp || !['APPROVED','ACTIVE'].includes(camp.status))
        return next(createError('Campaign not found or not active', 404));
    }

    const txRef = `wedonate-${uuidv4()}`;

    // Get title for customization
    let targetTitle = description || 'Donation to Adama Community';
    if (supportRequestId) {
      const r = await prisma.supportRequest.findUnique({ where: { id: supportRequestId }, select: { title: true } });
      targetTitle = r?.title || targetTitle;
    }
    if (campaignId) {
      const c = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { title: true } });
      targetTitle = c?.title || targetTitle;
    }

    const donation = await prisma.donation.create({
      data: {
        id: uuidv4(), donorId: req.user!.userId,
        amount: parseFloat(amount), currency: currency || 'ETB',
        donationType: donationType || 'MONEY',
        description: description || null, isAnonymous: isAnonymous || false,
        paymentStatus: 'PENDING', chapaRef: txRef,
        supportRequestId: supportRequestId || null,
        campaignId: campaignId || null,
      },
    });

    const chapaPayload = {
      amount: amount.toString(), currency: currency || 'ETB',
      email: user.email, first_name: user.firstName, last_name: user.lastName,
      phone_number: user.phone || '', tx_ref: txRef,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify?tx_ref=${txRef}`,
      return_url:   `${process.env.FRONTEND_URL}/payment/success?tx_ref=${txRef}`,
      customization: {
        title: 'WeDonate — Adama Community',
        description: targetTitle,
        logo: `${process.env.FRONTEND_URL}/adama_logo.png`,
      },
    };

    const chapaResponse = await axios.post(`${CHAPA_BASE_URL}/transaction/initialize`, chapaPayload, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}`, 'Content-Type': 'application/json' },
    });

    const checkoutUrl = chapaResponse.data?.data?.checkout_url;
    await prisma.donation.update({ where: { id: donation.id }, data: { chapaCheckoutUrl: checkoutUrl } });

    res.json({ success: true, data: { donationId: donation.id, txRef, checkoutUrl } });
  } catch (error: any) {
    console.error('Chapa init error:', error?.response?.data || error.message);
    next(createError(error?.response?.data?.message || 'Payment initialization failed', 500));
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { txRef } = req.params;

    const verifyResponse = await axios.get(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
    });

    const status = verifyResponse.data?.data?.status;
    const paymentStatus = status === 'success' ? 'SUCCESS' : status === 'failed' ? 'FAILED' : 'PENDING';

    const donation = await prisma.donation.update({
      where: { chapaRef: txRef },
      data: { paymentStatus: paymentStatus as any },
    });

    if (paymentStatus === 'SUCCESS') {
      // Update raised amounts
      if (donation.supportRequestId) {
        await prisma.supportRequest.update({
          where: { id: donation.supportRequestId },
          data: { raisedAmount: { increment: donation.amount || 0 } },
        });
      }
      if (donation.campaignId) {
        await prisma.campaign.update({
          where: { id: donation.campaignId },
          data: { raisedAmount: { increment: donation.amount || 0 } },
        });
      }

      // Notify donor
      await prisma.notification.create({
        data: {
          id: uuidv4(), userId: donation.donorId,
          title: 'Donation Successful 🎉',
          message: `Your donation of ${donation.amount} ETB was received. Thank you for your generosity!`,
          type: 'SUCCESS',
        },
      });

      await prisma.auditLog.create({
        data: {
          id: uuidv4(), userId: donation.donorId,
          action: 'PAYMENT_SUCCESS', resource: 'donation',
          resourceId: donation.id, details: `Amount: ${donation.amount} ETB, Ref: ${txRef}`,
        },
      });
    }

    res.json({ success: true, data: { status: paymentStatus, donation, chapaData: verifyResponse.data?.data } });
  } catch (error: any) {
    console.error('Chapa verify error:', error?.response?.data || error.message);
    next(createError('Payment verification failed', 500));
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tx_ref, status } = req.body;
    if (!tx_ref) return res.status(400).json({ error: 'No tx_ref' });

    const paymentStatus = status === 'success' ? 'SUCCESS' : 'FAILED';
    await prisma.donation.updateMany({ where: { chapaRef: tx_ref }, data: { paymentStatus: paymentStatus as any } });

    res.json({ message: 'Webhook received' });
  } catch (error) { next(error); }
};
