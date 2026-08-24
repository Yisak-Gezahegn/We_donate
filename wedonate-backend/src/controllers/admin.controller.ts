import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, search } = req.query;
    let baseWhere: any = {};
    
    // Enforce role-based scoping
    if (req.user!.role === 'KEBELE_ADMIN') {
      baseWhere.role = 'USER';
      baseWhere.kebeleId = req.user!.kebeleId;
    } else if (req.user!.role === 'CITY_ADMIN') {
      baseWhere.role = { in: ['KEBELE_ADMIN', 'USER', 'ORGANIZATION'] };
    } else if (req.user!.role === 'SYSTEM_ADMIN') {
      // SYSTEM_ADMIN sees everyone by default unless filtered
    } else {
      return next(createError('Unauthorized to view users', 403));
    }

    const users = await prisma.user.findMany({
      where: {
        ...baseWhere,
        ...(role && (!baseWhere.role || req.user!.role === 'SYSTEM_ADMIN') ? { role: role as any } : {}),
        ...(search ? {
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName:  { contains: search as string, mode: 'insensitive' } },
            { email:     { contains: search as string, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true, profileImage: true, registrationExpiry: true, licenseExpiry: true, createdAt: true, verificationStatus: true, orgType: true, orgName: true, licenseNumber: true, registrationDocUrl: true, representativeName: true, officeAddress: true, rejectionReason: true, kebeleId: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      return next(createError('You cannot delete your own account', 400));
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, firstName: true, lastName: true } });
    if (!target) return next(createError('User not found', 404));

    // Only a SYSTEM_ADMIN may delete another SYSTEM_ADMIN or CITY_ADMIN
    if (['SYSTEM_ADMIN', 'CITY_ADMIN'].includes(target.role) && req.user!.role !== 'SYSTEM_ADMIN') {
      return next(createError('Only a System Admin can deactivate admin accounts', 403));
    }

    // Soft delete (archive) instead of hard delete to preserve financial and audit history
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'ARCHIVE_USER', resource: 'user', resourceId: id,
        details: `Archived user ${target.firstName} ${target.lastName} (${target.role})`,
      },
    });

    res.json({ success: true, message: 'User archived successfully' });
  } catch (error) { next(error); }
};

export const assignRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'ORGANIZATION', 'KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'];
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
      pendingVerifications, publishedRequests, activeCampaigns,
      recentActivity, monthlyDonations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.donation.count({ where: { paymentStatus: 'SUCCESS' } }),
      prisma.donation.aggregate({ _sum: { amount: true }, where: { paymentStatus: 'SUCCESS' } }),
      prisma.supportRequest.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.campaign.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.donation.findMany({
        take: 10, where: { paymentStatus: 'SUCCESS' },
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count(),
      prisma.supportRequest.count({ where: { status: 'FULFILLED' } }),
      prisma.donation.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.supportRequest.count({ where: { isPublished: true } }),
      prisma.campaign.count({ where: { status: 'PUBLISHED' } }),
      prisma.auditLog.findMany({
        take: 10,
        include: { user: { select: { firstName: true, lastName: true, profileImage: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.$queryRaw`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count, COALESCE(SUM("amount"), 0)::float as total
        FROM "donations"
        WHERE "paymentStatus" = 'SUCCESS' AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `,
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalDonations,
        totalAmount: totalAmountResult._sum.amount || 0,
        pendingRequests, pendingCampaigns,
        recentDonations, totalCampaigns, fulfilledRequests,
        pendingVerifications, publishedRequests, activeCampaigns,
        recentActivity, monthlyDonations,
      },
    });
  } catch (error) { next(error); }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, userId, dateFrom, dateTo, search, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (action) where.action = { contains: action as string, mode: 'insensitive' };
    if (userId) where.userId = userId as string;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { details: { contains: search as string, mode: 'insensitive' } },
        { resource: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ success: true, data: logs, pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) } });
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
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true, registrationExpiry: true, licenseExpiry: true },
    });
    res.json({ success: true, data: user, message: 'Document expiry updated' });
  } catch (error) { next(error); }
};

export const toggleVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, verificationStatus: true, firstName: true, lastName: true, role: true },
    });
    if (!targetUser) return next(createError('User not found', 404));

    if (targetUser.role === 'ORGANIZATION' && !['CITY_ADMIN', 'SYSTEM_ADMIN'].includes(req.user!.role)) {
      return next(createError('Only City or System Admins can verify organizations', 403));
    }

    if (targetUser.role === 'USER' && req.user!.role === 'KEBELE_ADMIN') {
      const targetUserFull = await prisma.user.findUnique({ where: { id: req.params.id }, select: { kebeleId: true } });
      if (targetUserFull?.kebeleId !== req.user!.kebeleId) {
        return next(createError('You can only verify users in your Kebele', 403));
      }
    }

    const newVerifiedState = targetUser.verificationStatus !== 'VERIFIED';
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { verificationStatus: newVerifiedState ? 'VERIFIED' : 'UNVERIFIED' },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true },
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

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
    if (!firstName || !lastName || !email || !password) return next(createError('First name, last name, email and password are required', 400));
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError('Email already in use', 409));
    const user = await prisma.user.create({
      data: { id: uuidv4(), firstName, lastName, email, password, phone: phone || null, role: (role || 'USER') as any },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'CREATE_USER', resource: 'user', resourceId: user.id, details: `Created user ${firstName} ${lastName} (${email})` },
    });
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  } catch (error) { next(error); }
};

export const getAllDonationsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    const where: any = {};
    if (status) where.paymentStatus = status as any;
    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where, skip, take,
        include: {
          donor: { select: { firstName: true, lastName: true, email: true, profileImage: true } },
          supportRequest: { select: { title: true } },
          campaign: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where }),
    ]);
    res.json({ success: true, data: donations, pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) } });
  } catch (error) { next(error); }
};

export const getPendingDonations = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { paymentStatus: 'PENDING' },
      include: {
        donor: { select: { firstName: true, lastName: true, email: true, phone: true } },
        supportRequest: { select: { title: true } },
        campaign: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: donations });
  } catch (error) { next(error); }
};

export const verifyDonation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return next(createError('Donation not found', 404));

    const updated = await prisma.donation.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'SUCCESS', verifiedAt: new Date(), verifiedBy: req.user!.userId },
    });

    if (donation.amount) {
      if (donation.supportRequestId) {
        const updatedSR = await prisma.supportRequest.update({ where: { id: donation.supportRequestId }, data: { raisedAmount: { increment: donation.amount } } });
        if (updatedSR.goalAmount && updatedSR.raisedAmount >= updatedSR.goalAmount) {
          await prisma.supportRequest.update({ where: { id: donation.supportRequestId }, data: { status: 'FULFILLED' } });
        }
      }
      if (donation.campaignId) {
        const updatedCamp = await prisma.campaign.update({ where: { id: donation.campaignId }, data: { raisedAmount: { increment: donation.amount } } });
        if (updatedCamp.raisedAmount >= updatedCamp.goalAmount) {
          await prisma.campaign.update({ where: { id: donation.campaignId }, data: { status: 'COMPLETED' } });
        }
      }
    }

    await prisma.notification.create({
      data: { id: uuidv4(), userId: donation.donorId, title: 'Donation Verified', message: `Your donation of ${donation.amount || 0} ETB has been verified and confirmed.`, type: 'SUCCESS' },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'VERIFY_DONATION', resource: 'donation', resourceId: donation.id, details: `Verified donation of ${donation.amount || 0} ETB from donor ${donation.donorId}` },
    });

    res.json({ success: true, data: updated, message: 'Donation verified successfully' });
  } catch (error) { next(error); }
};

export const rejectDonation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return next(createError('Donation not found', 404));

    const updated = await prisma.donation.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'FAILED', rejectionReason: reason || null },
    });

    await prisma.notification.create({
      data: { id: uuidv4(), userId: donation.donorId, title: 'Donation Rejected', message: `Your donation has been rejected.${reason ? ` Reason: ${reason}` : ''}`, type: 'ERROR' },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'REJECT_DONATION', resource: 'donation', resourceId: donation.id, details: `Rejected donation. Reason: ${reason || 'N/A'}` },
    });

    res.json({ success: true, data: updated, message: 'Donation rejected' });
  } catch (error) { next(error); }
};

export const publishRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.supportRequest.update({
      where: { id: req.params.id },
      data: { isPublished: true, publishedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'PUBLISH_REQUEST', resource: 'support_request', resourceId: req.params.id, details: `Published request: ${request.title}` },
    });
    res.json({ success: true, data: request, message: 'Request published' });
  } catch (error) { next(error); }
};

export const fulfillRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.supportRequest.update({
      where: { id: req.params.id },
      data: { status: 'FULFILLED' },
    });
    await prisma.notification.create({
      data: { id: uuidv4(), userId: request.userId, title: 'Request Fulfilled', message: `Your support request "${request.title}" has been marked as fulfilled.`, type: 'SUCCESS' },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'FULFILL_REQUEST', resource: 'support_request', resourceId: req.params.id, details: `Fulfilled request: ${request.title}` },
    });
    res.json({ success: true, data: request, message: 'Request marked as fulfilled' });
  } catch (error) { next(error); }
};

export const publishCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { isPublished: true, publishedAt: new Date(), status: 'PUBLISHED' },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'PUBLISH_CAMPAIGN', resource: 'campaign', resourceId: req.params.id, details: `Published campaign: ${campaign.title}` },
    });
    res.json({ success: true, data: campaign, message: 'Campaign published and activated' });
  } catch (error) { next(error); }
};

export const getPendingOrganizations = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.user.findMany({
      where: { verificationStatus: 'PENDING' },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, verificationStatus: true, orgType: true, orgName: true,
        licenseNumber: true, registrationDocUrl: true, representativeName: true,
        officeAddress: true, registrationExpiry: true, licenseExpiry: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orgs });
  } catch (error) { next(error); }
};

export const approveOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, verificationStatus: true, firstName: true, lastName: true, role: true },
    });
    if (!targetUser) return next(createError('User not found', 404));
    if (targetUser.verificationStatus !== 'PENDING') return next(createError('Organization is not pending', 400));

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { verificationStatus: 'VERIFIED' },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'APPROVE_ORG', resource: 'user', resourceId: req.params.id,
        details: `Approved organization: ${targetUser.firstName} ${targetUser.lastName}`,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: 'Organization Approved',
        message: 'Your organization has been approved. You can now create campaigns and start fundraising.',
        type: 'SUCCESS',
      },
    });

    res.json({ success: true, data: user, message: 'Organization approved successfully' });
  } catch (error) { next(error); }
};

export const rejectOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, verificationStatus: true, firstName: true, lastName: true },
    });
    if (!targetUser) return next(createError('User not found', 404));
    if (targetUser.verificationStatus !== 'PENDING') return next(createError('Organization is not pending', 400));

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason || null },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true, rejectionReason: true },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'REJECT_ORG', resource: 'user', resourceId: req.params.id,
        details: `Rejected organization: ${targetUser.firstName} ${targetUser.lastName}. Reason: ${reason || 'N/A'}`,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: 'Organization Rejected',
        message: `Your organization registration has been rejected.${reason ? ` Reason: ${reason}` : ''} Please contact support for more information.`,
        type: 'ERROR',
      },
    });

    res.json({ success: true, data: user, message: 'Organization rejected' });
  } catch (error) { next(error); }
};
