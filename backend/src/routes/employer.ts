/**
 * Employer Routes
 */

import { Router } from 'express';
import { createEmployer, getEmployer, updateEmployer, listEmployers, deleteEmployer } from '../controllers/employerController';

const router = Router();

/**
 * GET /api/employers
 * List all employers
 * Note: This must come before /:walletAddress route to avoid conflicts
 */
router.get('/', listEmployers);

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

/**
 * DELETE /api/employers/:id
 * Delete employer (soft delete)
 */
router.delete('/:id', deleteEmployer);

export default router;
