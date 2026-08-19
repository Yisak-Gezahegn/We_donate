import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const generateToken = (userId: string, email: string, role: string) =>
  jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password)
      return next(createError('Please provide all required fields', 400));

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError('Email already in use', 409));

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(), firstName, lastName, email,
        password: hashedPassword, phone: phone || null,
        role: 'USER',
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    });

    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token },
    });
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(createError('Email and password are required', 400));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return next(createError('Invalid credentials', 401));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(createError('Invalid credentials', 401));

    const token = generateToken(user.id, user.email, user.role);

    await prisma.auditLog.create({
      data: { id: uuidv4(), userId: user.id, action: 'LOGIN', resource: 'auth', ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, profileImage: user.profileImage },
        token,
      },
    });
  } catch (error) { next(error); }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, profileImage: true, isVerified: true, createdAt: true },
    });
    if (!user) return next(createError('User not found', 404));
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = generateToken(req.user!.userId, req.user!.email, req.user!.role);
    res.json({ success: true, data: { token } });
  } catch (error) { next(error); }
};
