import { Router } from 'express';
import { getAllNews, getNewsById, createNews, updateNews, deleteNews } from '../controllers/news.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/',      getAllNews);
router.get('/:id',   getNewsById);
router.post('/',     authenticate, authorize(...ADMIN), createNews);
router.patch('/:id', authenticate, authorize(...ADMIN), updateNews);
router.delete('/:id', authenticate, authorize(...ADMIN), deleteNews);

export default router;
