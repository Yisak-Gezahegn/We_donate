import { Router } from 'express';
import { createDonation, getDonations, getDonationById, getMyDonations, getDonationStats } from '../controllers/donation.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/',       optionalAuthenticate, createDonation);
router.get('/',        getDonations);
router.get('/stats',   getDonationStats);
router.get('/my',      authenticate, getMyDonations);
router.get('/:id',     getDonationById);

export default router;
