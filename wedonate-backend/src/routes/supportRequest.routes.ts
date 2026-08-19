import { Router } from 'express';
import {
  createRequest, getApprovedRequests, getAllRequests,
  getMyRequests, updateRequestStatus, getRequestById,
} from '../controllers/supportRequest.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

const ADMIN_ROLES = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/',          getApprovedRequests);
router.post('/',         authenticate, createRequest);
router.get('/my',        authenticate, getMyRequests);
router.get('/all',       authenticate, authorize(...ADMIN_ROLES), getAllRequests);
router.get('/:id',       authenticate, getRequestById);
router.patch('/:id/status', authenticate, authorize(...ADMIN_ROLES), updateRequestStatus);

export default router;
