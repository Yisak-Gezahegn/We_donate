import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllRead, clearAll, deleteNotification } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.delete('/clear-all', authenticate, clearAll);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
