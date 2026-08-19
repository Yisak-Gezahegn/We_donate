import { Router } from 'express';
import { getAllUsers, assignRole, toggleUserActive, getDashboardStats, getAuditLogs } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/users',             authenticate, authorize(...ADMIN), getAllUsers);
router.patch('/users/:id/role',  authenticate, authorize('SUPER_ADMIN'), assignRole);
router.patch('/users/:id/toggle-active', authenticate, authorize(...ADMIN), toggleUserActive);
router.get('/dashboard',         authenticate, authorize(...ADMIN), getDashboardStats);
router.get('/audit-logs',        authenticate, authorize('SUPER_ADMIN','CITY_ADMIN'), getAuditLogs);

export default router;
