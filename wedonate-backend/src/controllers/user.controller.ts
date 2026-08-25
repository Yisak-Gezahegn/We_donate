import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, profileImage: true,
        verificationStatus: true, createdAt: true, verifiedByRole: true,
        donations: {
          take: 5, orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, donationType: true, paymentStatus: true, createdAt: true },
        },
      },
    });
    if (!user) return next(createError('User not found', 404));
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName: firstName || undefined,
        lastName:  lastName  || undefined,
        phone:     phone     || undefined,
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, profileImage: true },
    });
    res.json({ success: true, data: user, message: 'Profile updated' });
  } catch (error) { next(error); }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(createError('No file uploaded', 400));
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { profileImage: imageUrl },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, profileImage: true },
    });
    res.json({ success: true, data: { imageUrl, user }, message: 'Profile image updated' });
  } catch (error) { next(error); }
};
