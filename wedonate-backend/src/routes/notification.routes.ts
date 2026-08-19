import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllRead, clearAll } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.delete('/clear-all', authenticate, clearAll);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markAsRead);

export default router;
