import { Router } from 'express';
import {
  getAllUsers, assignRole, toggleUserActive, getDashboardStats, getAuditLogs,
  toggleVerification, updateDocumentExpiry, createUser,
  getAllDonationsAdmin, getPendingDonations, verifyDonation, rejectDonation,
  publishRequest, fulfillRequest, publishCampaign,
} from '../controllers/admin.controller';
import { getInspectionReports, createInspectionReport, resolveInspection, deleteInspection } from '../controllers/inspection.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/users',               authenticate, authorize(...ADMIN), getAllUsers);
router.post('/users',              authenticate, authorize(...ADMIN), createUser);
router.patch('/users/:id/role',    authenticate, authorize('SUPER_ADMIN'), assignRole);
router.patch('/users/:id/toggle-active', authenticate, authorize(...ADMIN), toggleUserActive);
router.patch('/users/:id/toggle-verification', authenticate, authorize(...ADMIN), toggleVerification);
router.patch('/users/:id/document-expiry', authenticate, authorize(...ADMIN), updateDocumentExpiry);

router.get('/dashboard',           authenticate, authorize(...ADMIN), getDashboardStats);
router.get('/audit-logs',          authenticate, authorize('SUPER_ADMIN','CITY_ADMIN'), getAuditLogs);

router.get('/donations',           authenticate, authorize(...ADMIN), getAllDonationsAdmin);
router.get('/donations/pending',   authenticate, authorize(...ADMIN), getPendingDonations);
router.patch('/donations/:id/verify', authenticate, authorize(...ADMIN), verifyDonation);
router.patch('/donations/:id/reject', authenticate, authorize(...ADMIN), rejectDonation);

router.patch('/requests/:id/publish', authenticate, authorize(...ADMIN), publishRequest);
router.patch('/requests/:id/fulfill', authenticate, authorize(...ADMIN), fulfillRequest);
router.patch('/campaigns/:id/publish', authenticate, authorize(...ADMIN), publishCampaign);

router.get('/inspections',             authenticate, authorize(...ADMIN), getInspectionReports);
router.post('/inspections',            authenticate, authorize(...ADMIN), createInspectionReport);
router.patch('/inspections/:id/resolve', authenticate, authorize(...ADMIN), resolveInspection);
router.delete('/inspections/:id',      authenticate, authorize(...ADMIN), deleteInspection);

export default router;
