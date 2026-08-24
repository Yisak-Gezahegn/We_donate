import { Router } from 'express';
import { getMessages, getSentMessages, sendMessage, broadcastMessage, markMessageRead, getUnreadCount, contactForm } from '../controllers/message.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['CITY_ADMIN','SYSTEM_ADMIN'];

router.post('/contact',          contactForm);
router.get('/',             authenticate, getMessages);
router.get('/sent',         authenticate, getSentMessages);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/',            authenticate, sendMessage);
router.post('/broadcast',   authenticate, authorize(...ADMIN), broadcastMessage);
router.patch('/:id/read',   authenticate, markMessageRead);

export default router;
