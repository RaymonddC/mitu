/**
 * Payroll Routes
 */

import { Router } from 'express';
import {
  runPayroll,
  getPayrollHistory,
  getPayrollLog,
  retryFailedPayroll
} from '../controllers/payrollController';

const router = Router();

/**
 * POST /api/payroll/run
 * Manually trigger payroll execution
 */
router.post('/run', runPayroll);

/**
 * GET /api/payroll/history?employerId=xxx
 * Get payroll execution history
 */
router.get('/history', getPayrollHistory);

/**
 * GET /api/payroll/:logId
 * Get single payroll log details
 */
router.get('/:logId', getPayrollLog);

/**
 * POST /api/payroll/:logId/retry
 * Retry failed payroll execution
 */
router.post('/:logId/retry', retryFailedPayroll);

export default router;
