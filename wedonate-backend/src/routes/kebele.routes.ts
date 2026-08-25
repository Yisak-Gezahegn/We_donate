import { Router } from 'express';
import { getActiveKebeles, getAllKebeles, createKebele, updateKebele } from '../controllers/kebele.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public route for registration
router.get('/active', getActiveKebeles);

// Admin routes
router.use(authenticate);
router.use(authorize('CITY_ADMIN', 'SYSTEM_ADMIN'));

router.get('/', getAllKebeles);
router.post('/', createKebele);
router.put('/:id', updateKebele);

export default router;
