import { Router } from 'express';
import { initializePayment, verifyPayment, handleWebhook } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/initialize', authenticate, initializePayment);
router.get('/verify/:txRef', authenticate, verifyPayment);
router.post('/webhook', handleWebhook);

export default router;
