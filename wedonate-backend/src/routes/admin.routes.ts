import { Router } from 'express';
import {
  getAllUsers, assignRole, toggleUserActive, getDashboardStats, getAuditLogs,
  toggleVerification, updateDocumentExpiry, createUser, deleteUser,
  getAllDonationsAdmin, getPendingDonations, verifyDonation, rejectDonation,
  publishRequest, fulfillRequest, publishCampaign,
  getPendingOrganizations, approveOrganization, rejectOrganization,
} from '../controllers/admin.controller';
import { getInspectionReports, createInspectionReport, resolveInspection, deleteInspection } from '../controllers/inspection.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ALL_ADMINS = ['KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'];
const CITY_AND_SYSTEM = ['CITY_ADMIN', 'SYSTEM_ADMIN'];
const SYSTEM_ONLY = ['SYSTEM_ADMIN'];

router.get('/users',               authenticate, authorize(...ALL_ADMINS), getAllUsers);
router.post('/users',              authenticate, authorize(...SYSTEM_ONLY), createUser);
router.delete('/users/:id',        authenticate, authorize(...SYSTEM_ONLY), deleteUser);
router.patch('/users/:id/role',    authenticate, authorize(...SYSTEM_ONLY), assignRole);
router.patch('/users/:id/toggle-active', authenticate, authorize(...CITY_AND_SYSTEM), toggleUserActive);
router.patch('/users/:id/toggle-verification', authenticate, authorize(...CITY_AND_SYSTEM), toggleVerification);
router.patch('/users/:id/document-expiry', authenticate, authorize(...CITY_AND_SYSTEM), updateDocumentExpiry);

router.get('/organizations/pending', authenticate, authorize(...CITY_AND_SYSTEM), getPendingOrganizations);
router.patch('/organizations/:id/approve', authenticate, authorize(...CITY_AND_SYSTEM), approveOrganization);
router.patch('/organizations/:id/reject', authenticate, authorize(...CITY_AND_SYSTEM), rejectOrganization);

router.get('/dashboard',           authenticate, authorize(...ALL_ADMINS), getDashboardStats);
router.get('/audit-logs',          authenticate, authorize(...SYSTEM_ONLY), getAuditLogs);

router.get('/donations',           authenticate, authorize(...CITY_AND_SYSTEM), getAllDonationsAdmin);
router.get('/donations/pending',   authenticate, authorize(...CITY_AND_SYSTEM), getPendingDonations);
router.patch('/donations/:id/verify', authenticate, authorize(...CITY_AND_SYSTEM), verifyDonation);
router.patch('/donations/:id/reject', authenticate, authorize(...CITY_AND_SYSTEM), rejectDonation);

router.patch('/requests/:id/publish', authenticate, authorize(...ALL_ADMINS), publishRequest);
router.patch('/requests/:id/fulfill', authenticate, authorize(...ALL_ADMINS), fulfillRequest);
router.patch('/campaigns/:id/publish', authenticate, authorize(...CITY_AND_SYSTEM), publishCampaign);

router.get('/inspections',             authenticate, authorize(...ALL_ADMINS), getInspectionReports);
router.post('/inspections',            authenticate, authorize(...ALL_ADMINS), createInspectionReport);
router.patch('/inspections/:id/resolve', authenticate, authorize(...ALL_ADMINS), resolveInspection);
router.delete('/inspections/:id',      authenticate, authorize(...SYSTEM_ONLY), deleteInspection);

export default router;
