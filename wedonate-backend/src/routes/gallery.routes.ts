import { Router } from 'express';
import { getGallery, addPhoto, deletePhoto } from '../controllers/gallery.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/',       getGallery);
router.post('/',      authenticate, authorize(...ADMIN), addPhoto);
router.delete('/:id', authenticate, authorize(...ADMIN), deletePhoto);

export default router;
