/**
 * Balance Routes
 * Virtual balance management for multi-employer platform
 */

import { Router } from 'express';
import {
  deposit,
  withdraw,
  getBalance,
  getTransactionHistory,
  getPlatformStats
} from '../controllers/balanceController';

const router = Router();

/**
 * POST /api/balance/employers/:employerId/deposit
 * Deposit funds to employer's virtual balance
 */
router.post('/employers/:employerId/deposit', deposit);

/**
 * POST /api/balance/employers/:employerId/withdraw
 * Withdraw funds from employer's virtual balance
 */
router.post('/employers/:employerId/withdraw', withdraw);

/**
 * GET /api/balance/employers/:employerId/balance
 * Get current balance for employer
 */
router.get('/employers/:employerId/balance', getBalance);

/**
 * GET /api/balance/employers/:employerId/transactions
 * Get transaction history for employer
 */
router.get('/employers/:employerId/transactions', getTransactionHistory);

/**
 * GET /api/balance/platform/stats
 * Get platform-wide statistics
 */
router.get('/platform/stats', getPlatformStats);

export default router;
