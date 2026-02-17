import {Router} from 'express';
import { getWebHooks, linkWhatsApp, postWebHooks } from '../controllers/webhooks';
import { verifyJWT } from '../middleware/auth';

const router :Router = Router();
router.post('/webhooks', postWebHooks)
router.get('/webhooks', getWebHooks);
router.post('/link-whatsapp', linkWhatsApp)

export default router