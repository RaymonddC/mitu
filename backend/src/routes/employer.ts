/**
 * Employer Routes
 */

import { Router } from 'express';
import { createEmployer, getEmployer, updateEmployer } from '../controllers/employerController';

const router = Router();

/**
 * POST /api/employers
 * Create a new employer account
 */
router.post('/', createEmployer);

/**
 * GET /api/employers/:walletAddress
 * Get employer by wallet address
 */
router.get('/:walletAddress', getEmployer);

/**
 * PUT /api/employers/:id
 * Update employer details
 */
router.put('/:id', updateEmployer);

export default router;
