import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getUpdatesByCampaign, createUpdate, deleteUpdate } from '../controllers/campaignUpdate.controller';

const router = Router();

router.get('/campaign/:campaignId', authenticate, getUpdatesByCampaign);
router.post('/campaign/:campaignId', authenticate, createUpdate);
router.delete('/:id', authenticate, deleteUpdate);

export default router;
