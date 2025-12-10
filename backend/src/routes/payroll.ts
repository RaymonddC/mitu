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
import { prisma } from '../server';

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

/**
 * GET /api/payroll/debug/count?employerId=xxx
 * Debug endpoint - check database directly
 */
router.get('/debug/count', async (req, res) => {
  try {
    const { employerId } = req.query;
    const count = await prisma.payrollLog.count({
      where: employerId ? { employerId: employerId as string } : {}
    });
    const latest = await prisma.payrollLog.findFirst({
      where: employerId ? { employerId: employerId as string } : {},
      orderBy: { executedAt: 'desc' },
      select: {
        id: true,
        executedAt: true,
        amount: true,
        status: true,
        employee: {
          select: { name: true }
        }
      }
    });
    const all = await prisma.payrollLog.findMany({
      where: employerId ? { employerId: employerId as string } : {},
      orderBy: { executedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        executedAt: true,
        amount: true,
        status: true
      }
    });
    res.json({
      totalCount: count,
      latestLog: latest,
      recentLogs: all
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
