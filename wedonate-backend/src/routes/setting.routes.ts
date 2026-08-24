import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['CITY_ADMIN','SYSTEM_ADMIN'];

router.get('/', getSettings);
router.patch('/', authenticate, authorize(...ADMIN), updateSettings);

export default router;
