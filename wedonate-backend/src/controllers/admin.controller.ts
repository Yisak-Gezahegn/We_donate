import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
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
      if (role && ['KEBELE_ADMIN', 'ORGANIZATION'].includes(role as string)) {
        baseWhere.role = role as string;
      } else {
        baseWhere.role = { in: ['KEBELE_ADMIN', 'ORGANIZATION'] };
      }
    } else if (req.user!.role === 'SYSTEM_ADMIN') {
      if (role) {
        baseWhere.role = role as string;
      }
    } else {
      return next(createError('Unauthorized to view users', 403));
    }

    const users = await prisma.user.findMany({
      where: {
        ...baseWhere,
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

export const assignKebele = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { kebeleId } = req.body;
    
    if (kebeleId) {
      const kebele = await prisma.kebele.findUnique({ where: { id: kebeleId } });
      if (!kebele || kebele.status !== 'ACTIVE') return next(createError('Valid active Kebele is required', 400));
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { kebeleId: kebeleId || null },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, kebeleId: true },
    });

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'ASSIGN_KEBELE', resource: 'user', resourceId: req.params.id, details: `Assigned kebele ${kebeleId}` },
    });

    res.json({ success: true, data: user, message: `Kebele assignment updated` });
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

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isKebeleAdmin = req.user!.role === 'KEBELE_ADMIN';
    const kebeleWhere = isKebeleAdmin ? { kebeleId: req.user!.kebeleId || 'UNASSIGNED' } : {};
    const userWhere = isKebeleAdmin ? { userId: req.user!.userId } : {};
    const [
      totalUsers, totalDonations, totalAmountResult,
      pendingRequests, pendingCampaigns,
      recentDonations, totalCampaigns, fulfilledRequests,
      pendingVerifications, publishedRequests, activeCampaigns,
      recentActivity, monthlyDonations, pendingUserVerifications,
    ] = await Promise.all([
      prisma.user.count({ where: isKebeleAdmin ? { role: 'USER', ...kebeleWhere } : {} }),
      prisma.donation.count({ where: { paymentStatus: 'SUCCESS' } }),
      prisma.donation.aggregate({ _sum: { amount: true }, where: { paymentStatus: 'SUCCESS' } }),
      prisma.supportRequest.count({ 
        where: isKebeleAdmin 
          ? { status: 'PENDING_REVIEW', kebeleId: req.user!.kebeleId || 'UNASSIGNED' }
          : { status: { in: ['PENDING_CITY_APPROVAL', 'APPROVED'] } }
      }),
      isKebeleAdmin ? Promise.resolve(0) : prisma.campaign.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.donation.findMany({
        take: 10, where: { paymentStatus: 'SUCCESS' },
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      isKebeleAdmin ? Promise.resolve(0) : prisma.campaign.count(),
      prisma.supportRequest.count({ where: { status: 'FULFILLED', ...kebeleWhere } }),
      prisma.donation.count({ 
        where: isKebeleAdmin 
          ? { paymentStatus: 'PENDING', supportRequest: { kebeleId: req.user!.kebeleId || 'UNASSIGNED', source: 'SELF_SERVICE' } }
          : { paymentStatus: 'PENDING', OR: [{ campaignId: { not: null } }, { supportRequest: { source: 'ASSISTED' } }] }
      }),
      prisma.supportRequest.count({ where: { isPublished: true, ...kebeleWhere } }),
      isKebeleAdmin ? Promise.resolve(0) : prisma.campaign.count({ where: { status: 'PUBLISHED' } }),
      prisma.auditLog.findMany({
        take: 10,
        where: userWhere,
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
      prisma.user.count({ 
        where: isKebeleAdmin 
          ? { verificationStatus: 'PENDING', kebeleId: req.user!.kebeleId || 'UNASSIGNED', role: 'USER' }
          : { verificationStatus: 'PENDING', role: 'ORGANIZATION' }
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalDonations,
        totalAmount: totalAmountResult._sum.amount || 0,
        pendingRequests, pendingCampaigns,
        recentDonations, totalCampaigns, fulfilledRequests,
        pendingVerifications, publishedRequests, activeCampaigns,
        recentActivity, monthlyDonations, pendingUserVerifications,
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
      data: {
        verificationStatus: newVerifiedState ? 'VERIFIED' : 'UNVERIFIED',
        verifiedById: newVerifiedState ? req.user!.userId : null,
        verifiedByRole: newVerifiedState ? req.user!.role : null,
        verifiedAt: newVerifiedState ? new Date() : null,
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true, verifiedById: true, verifiedByRole: true, verifiedAt: true },
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
    const { firstName, lastName, email, password, phone, role, orgType, orgName, licenseNumber, registrationDocUrl, representativeName, officeAddress, kebeleId } = req.body;
    if (!firstName || !lastName || !email || !password) return next(createError('First name, last name, email and password are required', 400));
    
    if (req.user!.role === 'CITY_ADMIN' && role !== 'KEBELE_ADMIN') {
      return next(createError('City Admin can only create Kebele Admins', 403));
    }

    if (role === 'KEBELE_ADMIN') {
      if (!kebeleId) return next(createError('Kebele assignment is required for Kebele Admin', 400));
      const kebele = await prisma.kebele.findUnique({ where: { id: kebeleId } });
      if (!kebele || kebele.status !== 'ACTIVE') return next(createError('Valid active Kebele is required', 400));
    }
    
    const isOrg = role === 'ORGANIZATION';
    if (isOrg) {
      if (!orgType || !orgName || !licenseNumber || !registrationDocUrl || !officeAddress) {
        return next(createError('All organization fields are required', 400));
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError('Email already in use', 409));
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: { 
        id: uuidv4(), firstName, lastName, email, password: hashedPassword, phone: phone || null, role: (role || 'USER') as any,
        orgType: isOrg ? orgType : null,
        orgName: isOrg ? orgName : null,
        licenseNumber: isOrg ? licenseNumber : null,
        registrationDocUrl: isOrg ? registrationDocUrl : null,
        representativeName: isOrg ? representativeName : null,
        officeAddress: isOrg ? officeAddress : null,
        kebeleId: role === 'KEBELE_ADMIN' ? kebeleId : null,
        verificationStatus: role === 'KEBELE_ADMIN' ? 'VERIFIED' : 'UNVERIFIED',
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true, kebeleId: true },
    });
    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'CREATE_USER', resource: 'user', resourceId: user.id, details: `Created user ${firstName} ${lastName} (${email})` },
    });
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  } catch (error) { next(error); }
};



export const getAllDonationsAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    const where: any = {};
    if (status) where.paymentStatus = status as any;
    
    if (req.user!.role === 'KEBELE_ADMIN') {
      where.supportRequest = { kebeleId: req.user!.kebeleId || 'UNASSIGNED', source: 'SELF_SERVICE' };
    } else if (req.user!.role === 'CITY_ADMIN') {
      where.OR = [
        { campaignId: { not: null } },
        { supportRequest: { source: 'ASSISTED' } }
      ];
    }
    
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

export const getPendingDonations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let where: any = { paymentStatus: 'PENDING' };
    if (req.user!.role === 'KEBELE_ADMIN') {
      where.supportRequest = { kebeleId: req.user!.kebeleId || 'UNASSIGNED', source: 'SELF_SERVICE' };
    } else if (req.user!.role === 'CITY_ADMIN') {
      where.OR = [
        { campaignId: { not: null } },
        { supportRequest: { source: 'ASSISTED' } }
      ];
    }

    const donations = await prisma.donation.findMany({
      where,
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
    const donation = await prisma.donation.findUnique({ 
      where: { id: req.params.id },
      include: { supportRequest: { select: { source: true, kebeleId: true } } }
    });
    if (!donation) return next(createError('Donation not found', 404));

    // Enforce ownership model
    if (req.user!.role === 'KEBELE_ADMIN') {
      if (!donation.supportRequest || donation.supportRequest.source !== 'SELF_SERVICE' || donation.supportRequest.kebeleId !== req.user!.kebeleId) {
        return next(createError('You are not authorized to verify this donation.', 403));
      }
    } else if (req.user!.role === 'CITY_ADMIN') {
      if (donation.supportRequest && donation.supportRequest.source === 'SELF_SERVICE') {
        return next(createError('City Admins cannot verify normal individual donations.', 403));
      }
    }

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

    if (donation.donorId) {
      await prisma.notification.create({
        data: { id: uuidv4(), userId: donation.donorId, title: 'Donation Verified', message: `Your donation has been verified successfully.`, type: 'SUCCESS' },
      });
    }

    let beneficiaryId: string | null = null;
    let createdById: string | null = null;
    let targetName = '';
    if (donation.supportRequestId) {
      const sr = await prisma.supportRequest.findUnique({ where: { id: donation.supportRequestId }, select: { userId: true, createdById: true, title: true } });
      beneficiaryId = sr?.userId ?? null;
      createdById = sr?.createdById ?? null;
      targetName = sr?.title ?? 'support request';
    } else if (donation.campaignId) {
      const camp = await prisma.campaign.findUnique({ where: { id: donation.campaignId }, select: { userId: true, title: true } });
      beneficiaryId = camp?.userId ?? null;
      targetName = camp?.title ?? 'campaign';
    }

    if (beneficiaryId) {
      await prisma.notification.create({
        data: {
          id: uuidv4(), userId: beneficiaryId,
          title: 'New Verified Donation 💰',
          message: `You received a verified donation of ETB ${donation.amount || 0} for "${targetName}".`,
          type: 'SUCCESS',
        },
      });
    } else if (createdById) {
      await prisma.notification.create({
        data: {
          id: uuidv4(), userId: createdById,
          title: 'New Verified Donation (Assisted Request) 💰',
          message: `An assisted request "${targetName}" you submitted received a verified donation of ETB ${donation.amount || 0}.`,
          type: 'SUCCESS',
        },
      });
    }

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: req.user!.userId, action: 'VERIFY_DONATION', resource: 'donation', resourceId: donation.id, details: `Verified donation of ${donation.amount || 0} ETB from donor ${donation.donorId}` },
    });

    res.json({ success: true, data: updated, message: 'Donation verified successfully' });
  } catch (error) { next(error); }
};

export const rejectDonation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const donation = await prisma.donation.findUnique({ 
      where: { id: req.params.id },
      include: { supportRequest: { select: { source: true, kebeleId: true } } }
    });
    if (!donation) return next(createError('Donation not found', 404));

    // Enforce ownership model
    if (req.user!.role === 'KEBELE_ADMIN') {
      if (!donation.supportRequest || donation.supportRequest.source !== 'SELF_SERVICE' || donation.supportRequest.kebeleId !== req.user!.kebeleId) {
        return next(createError('You are not authorized to reject this donation.', 403));
      }
    } else if (req.user!.role === 'CITY_ADMIN') {
      if (donation.supportRequest && donation.supportRequest.source === 'SELF_SERVICE') {
        return next(createError('City Admins cannot reject normal individual donations.', 403));
      }
    }

    const updated = await prisma.donation.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'FAILED', rejectionReason: reason || null },
    });

    if (donation.donorId) {
      await prisma.notification.create({
        data: { id: uuidv4(), userId: donation.donorId, title: 'Donation Rejected', message: `Your donation could not be verified. Please review the payment information.${reason ? ` Reason: ${reason}` : ''}`, type: 'ERROR' },
      });
    }
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
      data: { isPublished: true, publishedAt: new Date(), status: 'PUBLISHED' },
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
    if (request.userId) {
      await prisma.notification.create({
        data: { id: uuidv4(), userId: request.userId, title: 'Request Fulfilled', message: `Your support request "${request.title}" has been marked as fulfilled.`, type: 'SUCCESS' },
      });
    }
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
      where: { verificationStatus: 'PENDING', role: 'ORGANIZATION' },
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

export const getPendingUserVerifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kebeleId = req.user!.kebeleId;
    if (!kebeleId && req.user!.role !== 'SYSTEM_ADMIN') {
      return next(createError('No kebele assigned to admin', 400));
    }
    
    let whereClause: any = { role: 'USER', verificationStatus: { in: ['PENDING', 'CHANGES_REQUESTED', 'REJECTED'] } };
    if (req.user!.role === 'KEBELE_ADMIN') {
      whereClause.kebeleId = kebeleId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        verificationStatus: true, nationalIdFrontUrl: true, nationalIdBackUrl: true,
        fanNumber: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

export const approveUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, verificationStatus: true, firstName: true, lastName: true, kebeleId: true },
    });
    
    if (!targetUser) return next(createError('User not found', 404));
    
    if (req.user!.role === 'KEBELE_ADMIN' && targetUser.kebeleId !== req.user!.kebeleId) {
      return next(createError('Unauthorized to verify user from another Kebele', 403));
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { 
        verificationStatus: 'VERIFIED',
        verifiedById: req.user!.userId,
        verifiedByRole: req.user!.role,
        verifiedAt: new Date()
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'APPROVE_USER', resource: 'user', resourceId: req.params.id,
        details: `Approved user: ${targetUser.firstName} ${targetUser.lastName}`,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: 'Identity Verified',
        message: 'Your identity has been verified by the Kebele administration. You can now request support.',
        type: 'SUCCESS',
      },
    });

    res.json({ success: true, data: user, message: 'User approved successfully' });
  } catch (error) { next(error); }
};

export const rejectUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason, requestChanges } = req.body;
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, verificationStatus: true, firstName: true, lastName: true, kebeleId: true },
    });
    
    if (!targetUser) return next(createError('User not found', 404));
    
    if (req.user!.role === 'KEBELE_ADMIN' && targetUser.kebeleId !== req.user!.kebeleId) {
      return next(createError('Unauthorized to reject user from another Kebele', 403));
    }

    const newStatus = requestChanges ? 'CHANGES_REQUESTED' : 'REJECTED';

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { verificationStatus: newStatus as any, rejectionReason: reason || null },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true, rejectionReason: true },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(), userId: req.user!.userId,
        action: 'REJECT_USER', resource: 'user', resourceId: req.params.id,
        details: `${requestChanges ? 'Requested changes for' : 'Rejected'} user: ${targetUser.firstName} ${targetUser.lastName}. Reason: ${reason || 'N/A'}`,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(), userId: req.params.id,
        title: requestChanges ? 'Verification Changes Requested' : 'Verification Rejected',
        message: `Your identity verification was ${requestChanges ? 'returned for changes' : 'rejected'}.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'ERROR',
      },
    });

    res.json({ success: true, data: user, message: `User ${requestChanges ? 'returned for changes' : 'rejected'}` });
  } catch (error) { next(error); }
};

