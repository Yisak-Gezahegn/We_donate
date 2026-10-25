import { Router } from 'express';
import { register, login, getMe, refreshToken, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.get('/me',               authenticate, getMe);
router.post('/refresh',         authenticate, refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

export default router;
