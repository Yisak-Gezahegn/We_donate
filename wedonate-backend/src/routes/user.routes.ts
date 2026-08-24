import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const router = Router();

router.get('/profile',     authenticate, getProfile);
router.put('/profile',     authenticate, updateProfile);

// Update profile image URL (called after /api/upload)
router.post('/profile/image', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) { res.status(400).json({ success: false, message: 'imageUrl required' }); return; }
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { profileImage: imageUrl },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, profileImage: true },
    });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

router.post('/verify-request', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (user.verificationStatus === 'VERIFIED') { res.status(400).json({ success: false, message: 'Already verified' }); return; }
    
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { verificationStatus: 'PENDING' }
    });

    res.json({ success: true, message: 'Verification requested' });
  } catch (error) { next(error); }
});

export default router;
