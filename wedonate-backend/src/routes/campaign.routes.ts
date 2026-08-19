import { Router } from 'express';
import {
  createCampaign, getActiveCampaigns, getMyCampaigns,
  getAllCampaigns, updateCampaignStatus, getCampaignById,
} from '../controllers/campaign.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

router.get('/',               getActiveCampaigns);
router.post('/',              authenticate, createCampaign);
router.get('/my',             authenticate, getMyCampaigns);
router.get('/all',            authenticate, authorize(...ADMIN), getAllCampaigns);
router.get('/:id',            authenticate, getCampaignById);
router.patch('/:id/status',   authenticate, authorize(...ADMIN), updateCampaignStatus);

export default router;
