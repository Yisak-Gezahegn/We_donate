import { Router } from 'express';
import { createDonation, getDonations, getDonationById, getMyDonations, getDonationStats } from '../controllers/donation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/',       authenticate, createDonation);
router.get('/',        getDonations);
router.get('/stats',   getDonationStats);
router.get('/my',      authenticate, getMyDonations);
router.get('/:id',     getDonationById);

export default router;
