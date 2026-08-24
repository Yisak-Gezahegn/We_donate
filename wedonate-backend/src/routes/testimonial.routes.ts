import { Router } from 'express';
import { getTestimonials, getAllTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from '../controllers/testimonial.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['CITY_ADMIN','SYSTEM_ADMIN'];

router.get('/',       getTestimonials);
router.get('/all',    authenticate, authorize(...ADMIN), getAllTestimonials);
router.post('/',      authenticate, authorize(...ADMIN), addTestimonial);
router.put('/:id',    authenticate, authorize(...ADMIN), updateTestimonial);
router.delete('/:id', authenticate, authorize(...ADMIN), deleteTestimonial);

export default router;
