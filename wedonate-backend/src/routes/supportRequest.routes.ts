import { Router } from 'express';
import {
  createRequest, getApprovedRequests, getAllRequests,
  getMyRequests, updateRequestStatus, getRequestById, deleteRequest,
} from '../controllers/supportRequest.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

const ADMIN_ROLES = ['KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'];

router.get('/',          getApprovedRequests);
router.post('/',         authenticate, createRequest);
router.get('/my',        authenticate, getMyRequests);
router.get('/all',       authenticate, authorize(...ADMIN_ROLES), getAllRequests);
router.get('/:id',       optionalAuthenticate, getRequestById);
router.patch('/:id/status', authenticate, authorize(...ADMIN_ROLES), updateRequestStatus);
router.delete('/:id',    authenticate, authorize(...ADMIN_ROLES), deleteRequest);

export default router;
