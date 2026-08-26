import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

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
