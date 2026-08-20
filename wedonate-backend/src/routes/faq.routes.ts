import { Router } from 'express';
import { getAllFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faq.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/',      getAllFaqs);
router.post('/',     authenticate, authorize(...ADMIN), createFaq);
router.patch('/:id', authenticate, authorize(...ADMIN), updateFaq);
router.delete('/:id', authenticate, authorize(...ADMIN), deleteFaq);

export default router;
