import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllRead } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllRead);

export default router;
