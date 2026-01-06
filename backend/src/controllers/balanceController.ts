/**
 * Balance Controller
 * Handles virtual balance operations for multi-employer platform
 */

import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../middleware/errorHandler';
import { z } from 'zod';
import { balanceService } from '../services/balanceService';
import { logger } from '../middleware/logger';

// Validation schemas
const depositSchema = z.object({
  amount: z.number().positive('Deposit amount must be positive'),
  txHash: z.string().optional(),
  description: z.string().optional()
});

const withdrawSchema = z.object({
  amount: z.number().positive('Withdrawal amount must be positive'),
  destinationAddress: z.string().min(20, 'Invalid destination address'),
  description: z.string().optional()
});

const transactionHistorySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * Deposit funds to employer's virtual balance
 * POST /api/balance/employers/:employerId/deposit
 */
export async function deposit(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId } = req.params;
    const data = depositSchema.parse(req.body);

    const result = await balanceService.deposit(
      employerId,
      data.amount,
      data.txHash,
      data.description
    );

    logger.info('Balance deposit successful', {
      employerId,
      amount: data.amount,
      newBalance: result.newBalance
    });

    res.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        transaction: result.transaction
      },
      message: `Successfully deposited ${data.amount} MNEE`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Withdraw funds from employer's virtual balance
 * POST /api/balance/employers/:employerId/withdraw
 */
export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId } = req.params;
    const data = withdrawSchema.parse(req.body);

    const result = await balanceService.withdraw(
      employerId,
      data.amount,
      data.destinationAddress,
      data.description
    );

    logger.info('Balance withdrawal successful', {
      employerId,
      amount: data.amount,
      newBalance: result.newBalance
    });

    res.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        txHash: result.txHash
      },
      message: `Successfully withdrew ${data.amount} MNEE`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current balance for employer
 * GET /api/balance/employers/:employerId/balance
 */
export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId } = req.params;

    const { prisma } = await import('../server');
    const employer = await prisma.employer.findUnique({
      where: { id: employerId },
      select: {
        virtualBalance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        balanceUpdatedAt: true
      }
    });

    if (!employer) {
      throw new CustomError('Employer not found', 404);
    }

    res.json({
      success: true,
      data: {
        currentBalance: Number(employer.virtualBalance),
        totalDeposited: Number(employer.totalDeposited),
        totalWithdrawn: Number(employer.totalWithdrawn),
        lastUpdated: employer.balanceUpdatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get transaction history for employer
 * GET /api/balance/employers/:employerId/transactions?limit=50&offset=0
 */
export async function getTransactionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId } = req.params;
    const { limit = 50, offset = 0 } = transactionHistorySchema.parse(req.query);

    const result = await balanceService.getTransactionHistory(
      employerId,
      Number(limit),
      Number(offset)
    );

    res.json({
      success: true,
      data: {
        transactions: result.transactions.map((tx: any) => ({
          ...tx,
          amount: Number(tx.amount),
          balanceBefore: Number(tx.balanceBefore),
          balanceAfter: Number(tx.balanceAfter)
        })),
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get platform-wide statistics
 * GET /api/balance/platform/stats
 */
export async function getPlatformStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await balanceService.getPlatformStats();

    res.json({
      success: true,
      data: {
        totalDeposits: Number(stats.totalDeposits || 0),
        totalWithdrawals: Number(stats.totalWithdrawals || 0),
        totalPayrollPaid: Number(stats.totalPayrollPaid || 0),
        totalEmployers: stats.totalEmployers || 0,
        totalEmployees: stats.totalEmployees || 0,
        platformBalance: Number(stats.totalDeposits || 0) - Number(stats.totalWithdrawals || 0),
        lastUpdated: stats.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}
