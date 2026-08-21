import { Router } from 'express';
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/',      getAllEvents);
router.get('/:id',   getEventById);
router.post('/',     authenticate, authorize(...ADMIN), createEvent);
router.patch('/:id', authenticate, authorize(...ADMIN), updateEvent);
router.delete('/:id', authenticate, authorize(...ADMIN), deleteEvent);

export default router;
