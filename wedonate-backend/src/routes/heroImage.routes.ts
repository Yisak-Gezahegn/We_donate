import { Router } from 'express';
import { getHeroImages, getAllHeroImages, addHeroImage, updateHeroImage, deleteHeroImage } from '../controllers/heroImage.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['CITY_ADMIN','SYSTEM_ADMIN'];

router.get('/',       getHeroImages);
router.get('/all',    authenticate, authorize(...ADMIN), getAllHeroImages);
router.post('/',      authenticate, authorize(...ADMIN), addHeroImage);
router.put('/:id',    authenticate, authorize(...ADMIN), updateHeroImage);
router.delete('/:id', authenticate, authorize(...ADMIN), deleteHeroImage);

export default router;
