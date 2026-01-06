/**
 * Alert Routes
 */

import { Router } from 'express';
import { getAlerts, resolveAlert } from '../controllers/alertController';

const router = Router();

/**
 * GET /api/alerts?employerId=xxx
 * Get alerts for an employer
 */
router.get('/', getAlerts);

/**
 * PUT /api/alerts/:id/resolve
 * Mark alert as resolved
 */
router.put('/:id/resolve', resolveAlert);

export default router;
