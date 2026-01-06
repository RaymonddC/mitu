/**
 * Risk Screening Routes
 * API endpoints for risk analysis
 */

import { Router } from 'express';
import {
    screenWallet,
    batchScreenWallets,
    checkSanctions,
    screenEmployees,
    getRiskStats,
    clearCache,
    addToBlacklist,
    removeFromBlacklist
} from '../controllers/riskController';

const router = Router();

router.post('/screen', screenWallet);
router.post('/screen/batch', batchScreenWallets);
router.get('/sanctions/:address', checkSanctions);
router.post('/screen-employees', screenEmployees);
router.get('/stats', getRiskStats);
router.post('/cache/clear', clearCache);
router.post('/blacklist/add', addToBlacklist);
router.post('/blacklist/remove', removeFromBlacklist);

export default router;