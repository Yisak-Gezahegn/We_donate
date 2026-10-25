import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPasswordResetEmail } from '../lib/email';

const generateToken = (userId: string, email: string, role: string, kebeleId?: string | null) =>
  jwt.sign({ userId, email, role, kebeleId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      firstName, lastName, email, password, phone,
      accountType, orgType, orgName, licenseNumber,
      registrationDocUrl, representativeName, officeAddress,
      kebeleId,
    } = req.body;

    if (!firstName || !lastName || !email || !password)
      return next(createError('Please provide all required fields', 400));

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError('Email already in use', 409));

    const isOrg = accountType === 'organization';

    if (isOrg) {
      if (!orgType || !orgName || !licenseNumber || !registrationDocUrl || !officeAddress)
        return next(createError('All organization fields are required', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(), firstName, lastName, email,
        password: hashedPassword, phone: phone || null,
        role: isOrg ? 'ORGANIZATION' : 'USER',
        verificationStatus: isOrg ? 'PENDING' : 'UNVERIFIED',
        orgType: isOrg ? orgType : null,
        orgName: isOrg ? orgName : null,
        licenseNumber: isOrg ? licenseNumber : null,
        registrationDocUrl: isOrg ? registrationDocUrl : null,
        representativeName: isOrg ? representativeName : null,
        officeAddress: isOrg ? officeAddress : null,
        kebeleId: (!isOrg && kebeleId) ? kebeleId : null,
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, verificationStatus: true, createdAt: true, kebeleId: true },
    });

    const token = generateToken(user.id, user.email, user.role, user.kebeleId);

    res.status(201).json({
      success: true,
      message: isOrg
        ? 'Organization registered successfully. After registration, your account will be Pending. The Adama City Admin will verify your documents within 24–48 hours before you can start fundraising.'
        : 'Account created successfully',
      data: { user, token },
    });
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(createError('Email and password are required', 400));

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { kebele: { select: { id: true, name: true } } }
    });
    if (!user || !user.isActive) return next(createError('Invalid credentials', 401));

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return next(createError('Invalid credentials', 401));

    const token = generateToken(user.id, user.email, user.role, user.kebeleId);

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: user.id, action: 'LOGIN', resource: 'auth', ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, profileImage: user.profileImage, verificationStatus: user.verificationStatus, kebeleId: user.kebeleId, kebele: (user as any).kebele },
        token,
      },
    });
  } catch (error) { next(error); }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { 
        id: true, firstName: true, lastName: true, email: true, phone: true, 
        role: true, profileImage: true, verificationStatus: true, kebeleId: true, 
        orgType: true, orgName: true, rejectionReason: true, createdAt: true, 
        registrationExpiry: true, licenseExpiry: true,
        kebele: { select: { id: true, name: true } }
      },
    });
    if (!user) return next(createError('User not found', 404));
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = generateToken(req.user!.userId, req.user!.email, req.user!.role, req.user!.kebeleId);
    res.json({ success: true, data: { token } });
  } catch (error) { next(error); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return next(createError('Email is required', 400));

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration attacks
    if (!user || !user.isActive) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const resetToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiry   = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data:  { resetToken: hashedToken, resetTokenExpiry: resetExpiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl    = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail(email, user.firstName, resetUrl);

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: user.id, action: 'PASSWORD_RESET_REQUESTED', resource: 'auth', ipAddress: req.ip },
    });

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(createError('Failed to send reset email. Please try again.', 500));
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password)
      return next(createError('Token, email and new password are required', 400));

    if (password.length < 6)
      return next(createError('Password must be at least 6 characters', 400));

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken:       hashedToken,
        resetTokenExpiry: { gt: new Date() }, // not expired
      },
    });

    if (!user) return next(createError('Invalid or expired reset link. Please request a new one.', 400));

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password:         hashedPassword,
        resetToken:       null,
        resetTokenExpiry: null,
      },
    });

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: user.id, action: 'PASSWORD_RESET_SUCCESS', resource: 'auth', ipAddress: req.ip },
    });

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};
