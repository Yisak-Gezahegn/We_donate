import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(search ? {
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName:  { contains: search as string, mode: 'insensitive' } },
            { email:     { contains: search as string, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isVerified: true, isActive: true, profileImage: true, registrationExpiry: true, licenseExpiry: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

export const assignRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'NGO', 'ORGANIZATION', 'GOVERNMENTAL_ORG', 'KEBELE_ADMIN', 'WOREDA_ADMIN', 'CITY_ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) return next(createError('Invalid role', 400));

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: role as any },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'ASSIGN_ROLE', resource: 'user', resourceId: req.params.id, details: `Assigned role ${role}` },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: 'Role Updated',
        message: `Your account role has been updated to ${role.replace(/_/g, ' ')}.`,
        type: 'INFO',
      },
    });

    res.json({ success: true, data: user, message: `Role updated to ${role}` });
  } catch (error) { next(error); }
};

export const toggleUserActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, isActive: true, firstName: true, lastName: true },
    });
    if (!targetUser) return next(createError('User not found', 404));

    const newActiveState = !targetUser.isActive;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: newActiveState },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: newActiveState ? 'ACTIVATE_USER' : 'SUSPEND_USER',
        resource: 'user', resourceId: req.params.id,
        details: `${newActiveState ? 'Activated' : 'Suspended'} user ${targetUser.firstName} ${targetUser.lastName}`,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: newActiveState ? 'Account Activated' : 'Account Suspended',
        message: newActiveState
          ? 'Your account has been activated. You can now log in and use the platform.'
          : 'Your account has been suspended. Please contact an administrator for more information.',
        type: newActiveState ? 'SUCCESS' : 'ERROR',
      },
    });

    res.json({ success: true, data: user, message: `User ${newActiveState ? 'activated' : 'suspended'} successfully` });
  } catch (error) { next(error); }
};

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers, totalDonations, totalAmountResult,
      pendingRequests, pendingCampaigns,
      recentDonations, totalCampaigns, fulfilledRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.donation.count({ where: { paymentStatus: 'SUCCESS' } }),
      prisma.donation.aggregate({ _sum: { amount: true }, where: { paymentStatus: 'SUCCESS' } }),
      prisma.supportRequest.count({ where: { status: 'PENDING' } }),
      prisma.campaign.count({ where: { status: 'PENDING' } }),
      prisma.donation.findMany({
        take: 10, where: { paymentStatus: 'SUCCESS' },
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count(),
      prisma.supportRequest.count({ where: { status: 'FULFILLED' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalDonations,
        totalAmount: totalAmountResult._sum.amount || 0,
        pendingRequests, pendingCampaigns,
        recentDonations, totalCampaigns, fulfilledRequests,
      },
    });
  } catch (error) { next(error); }
};

export const getAuditLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

export const updateDocumentExpiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { registrationExpiry, licenseExpiry } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isVerified: true, registrationExpiry: true, licenseExpiry: true },
    });
    res.json({ success: true, data: user, message: 'Document expiry updated' });
  } catch (error) { next(error); }
};

export const toggleVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, isVerified: true, firstName: true, lastName: true, role: true },
    });
    if (!targetUser) return next(createError('User not found', 404));

    const ORG_ROLES = ['NGO', 'ORGANIZATION', 'GOVERNMENTAL_ORG'];
    if (!ORG_ROLES.includes(targetUser.role)) {
      return next(createError('Only organizations can be verified', 400));
    }

    const newVerifiedState = !targetUser.isVerified;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: newVerifiedState },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isVerified: true },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: newVerifiedState ? 'VERIFY_ORG' : 'UNVERIFY_ORG',
        resource: 'user', resourceId: req.params.id,
        details: `${newVerifiedState ? 'Verified' : 'Unverified'} organization ${targetUser.firstName} ${targetUser.lastName}`,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: newVerifiedState ? 'Organization Verified' : 'Verification Removed',
        message: newVerifiedState
          ? 'Your organization has been verified. A verified badge will now appear on your profile.'
          : 'Your organization verification has been removed.',
        type: newVerifiedState ? 'SUCCESS' : 'INFO',
      },
    });

    res.json({ success: true, data: user, message: `Organization ${newVerifiedState ? 'verified' : 'unverified'} successfully` });
  } catch (error) { next(error); }
};
