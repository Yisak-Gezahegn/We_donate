import { Router } from 'express';
import {
  createCampaign, getActiveCampaigns, getMyCampaigns,
  getAllCampaigns, updateCampaignStatus, getCampaignById, submitSuccessPhoto, deleteCampaign,
} from '../controllers/campaign.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();
const ADMIN = ['CITY_ADMIN', 'SYSTEM_ADMIN'];

router.get('/',               getActiveCampaigns);
router.post('/',              authenticate, createCampaign);
router.get('/my',             authenticate, getMyCampaigns);
router.get('/all',            authenticate, authorize(...ADMIN), getAllCampaigns);
router.get('/:id',            optionalAuthenticate, getCampaignById);
router.patch('/:id/status',   authenticate, authorize(...ADMIN), updateCampaignStatus);
router.delete('/:id',         authenticate, authorize(...ADMIN), deleteCampaign);
router.post('/:id/success-photo', authenticate, submitSuccessPhoto);

export default router;
