import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const ADMIN_ROLES = ['CITY_ADMIN','SYSTEM_ADMIN'];

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.message.findMany({
      where: { recipientId: req.user!.userId },
      include: { sender: { select: { firstName: true, lastName: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: messages });
  } catch (error) { next(error); }
};

export const getSentMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.message.findMany({
      where: { senderId: req.user!.userId },
      include: { recipient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: messages });
  } catch (error) { next(error); }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipientId, subject, body } = req.body;
    if (!subject || !body) return next(createError('Subject and body are required', 400));

    // If recipientId is null, it's a broadcast to all users
    if (recipientId) {
      const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
      if (!recipient) return next(createError('Recipient not found', 404));
    }

    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        senderId: req.user!.userId,
        recipientId: recipientId || null,
        subject, body,
      },
    });

    // Create notification for recipient
    if (recipientId) {
      await prisma.notification.create({
        data: {
          id: uuidv4(), userId: recipientId,
          title: `New Message: ${subject}`,
          message: body.substring(0, 100),
          type: 'INFO',
        },
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) { next(error); }
};

export const broadcastMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) return next(createError('Subject and body are required', 400));

    const users = await prisma.user.findMany({ select: { id: true } });
    const messages = await Promise.all(
      users.map(user =>
        prisma.message.create({
          data: { id: uuidv4(), senderId: req.user!.userId, recipientId: user.id, subject, body },
        })
      )
    );

    // Also create notifications
    await Promise.all(
      users.filter(u => u.id !== req.user!.userId).map(user =>
        prisma.notification.create({
          data: { id: uuidv4(), userId: user.id, title: `Announcement: ${subject}`, message: body.substring(0, 100), type: 'INFO' },
        })
      )
    );

    res.status(201).json({ success: true, data: { count: messages.length }, message: `Broadcast sent to ${messages.length} users` });
  } catch (error) { next(error); }
};

export const markMessageRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.message.updateMany({
      where: { id: req.params.id, recipientId: req.user!.userId },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.message.count({
      where: { recipientId: req.user!.userId, isRead: false },
    });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
};

export const contactForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return next(createError('Name, email, subject and message are required', 400));

    const admins = await prisma.user.findMany({
      where: { role: { in: ADMIN_ROLES as any[] } },
      select: { id: true },
    });

    if (!admins.length)
      return next(createError('No administrators available to receive messages', 500));

    const body = `[Contact Form]\nFrom: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\n\n${message}`;

    const messages = await Promise.all(
      admins.map(admin =>
        prisma.message.create({
          data: {
            id: uuidv4(),
            senderId: admins[0].id,
            recipientId: admin.id,
            subject: `[Contact Us] ${subject}`,
            body,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Your message has been sent. We will get back to you shortly.',
      data: { count: messages.length },
    });
  } catch (error) { next(error); }
};
