/**
 * Balance Service
 * Handles virtual balance operations for multi-employer custodial platform
 * Week 1: Virtual balance deposit/withdraw/tracking
 */

import { prisma } from '../server';
import { logger } from '../middleware/logger';

export class BalanceService {
  /**
   * Add funds to employer's virtual balance (deposit)
   */
  async deposit(
    employerId: string,
    amount: number,
    txHash?: string,
    description?: string
  ): Promise<{ newBalance: number; transaction: any }> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      if (amount <= 0) {
        throw new Error('Deposit amount must be positive');
      }

      const balanceBefore = Number(employer.virtualBalance);
      const balanceAfter = balanceBefore + amount;

      // Create transaction in database (atomic)
      const result = await prisma.$transaction(async (tx: any) => {
        // Update employer balance
        const updatedEmployer = await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            totalDeposited: { increment: amount },
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        const transaction = await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'deposit',
            amount,
            balanceBefore,
            balanceAfter,
            description: description || `Deposit of ${amount} MNEE`,
            txHash,
            metadata: {
              source: 'manual_deposit',
              timestamp: new Date().toISOString()
            }
          }
        });

        // Update platform stats
        await tx.platformStats.upsert({
          where: { id: 'platform' },
          create: {
            id: 'platform',
            totalDeposits: amount,
            updatedAt: new Date()
          },
          update: {
            totalDeposits: { increment: amount },
            updatedAt: new Date()
          }
        });

        return { updatedEmployer, transaction };
      });

      logger.info('Deposit successful', {
        employerId,
        amount,
        newBalance: balanceAfter,
        txHash
      });

      return {
        newBalance: balanceAfter,
        transaction: result.transaction
      };
    } catch (error: any) {
      logger.error('Deposit failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Withdraw funds from employer's virtual balance
   */
  async withdraw(
    employerId: string,
    amount: number,
    destinationAddress: string,
    description?: string
  ): Promise<{ newBalance: number; txHash: string }> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      if (amount <= 0) {
        throw new Error('Withdrawal amount must be positive');
      }

      const balanceBefore = Number(employer.virtualBalance);

      if (balanceBefore < amount) {
        throw new Error(`Insufficient balance. Available: ${balanceBefore} MNEE, Requested: ${amount} MNEE`);
      }

      const balanceAfter = balanceBefore - amount;

      // Execute blockchain withdrawal (from platform wallet to employer)
      // TODO: Implement actual MNEE transfer using mneeService
      const txHash = `withdrawal_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Update database
      await prisma.$transaction(async (tx: any) => {
        // Update employer balance
        await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            totalWithdrawn: { increment: amount },
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        const transaction = await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'withdrawal',
            amount: -amount, // Negative for withdrawals
            balanceBefore,
            balanceAfter,
            description: description || `Withdrawal of ${amount} MNEE to ${destinationAddress}`,
            txHash,
            metadata: {
              destinationAddress,
              source: 'manual_withdrawal',
              timestamp: new Date().toISOString()
            }
          }
        });

        // Update platform stats
        await tx.platformStats.upsert({
          where: { id: 'platform' },
          create: {
            id: 'platform',
            totalWithdrawals: amount,
            updatedAt: new Date()
          },
          update: {
            totalWithdrawals: { increment: amount },
            updatedAt: new Date()
          }
        });

        return transaction;
      });

      logger.info('Withdrawal successful', {
        employerId,
        amount,
        newBalance: balanceAfter,
        txHash
      });

      return {
        newBalance: balanceAfter,
        txHash
      };
    } catch (error: any) {
      logger.error('Withdrawal failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Deduct payroll from virtual balance
   */
  async deductPayroll(
    employerId: string,
    amount: number,
    payrollLogId: string
  ): Promise<number> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      const balanceBefore = Number(employer.virtualBalance);

      if (balanceBefore < amount) {
        throw new Error(
          `Insufficient virtual balance for payroll. Required: ${amount} MNEE, Available: ${balanceBefore} MNEE`
        );
      }

      const balanceAfter = balanceBefore - amount;

      // Update database
      await prisma.$transaction(async (tx: any) => {
        // Update employer balance
        await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'payroll_deduction',
            amount: -amount, // Negative for deductions
            balanceBefore,
            balanceAfter,
            description: `Payroll payment deduction`,
            referenceId: payrollLogId,
            metadata: {
              source: 'autonomous_payroll',
              timestamp: new Date().toISOString()
            }
          }
        });

        // Update platform stats
        await tx.platformStats.upsert({
          where: { id: 'platform' },
          create: {
            id: 'platform',
            totalPayrollPaid: amount,
            updatedAt: new Date()
          },
          update: {
            totalPayrollPaid: { increment: amount },
            updatedAt: new Date()
          }
        });
      });

      logger.info('Payroll deducted from virtual balance', {
        employerId,
        amount,
        newBalance: balanceAfter,
        payrollLogId
      });

      return balanceAfter;
    } catch (error: any) {
      logger.error('Payroll deduction failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Refund amount to virtual balance (for failed payroll)
   */
  async refund(
    employerId: string,
    amount: number,
    reason: string,
    referenceId?: string
  ): Promise<number> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      const balanceBefore = Number(employer.virtualBalance);
      const balanceAfter = balanceBefore + amount;

      // Update database
      await prisma.$transaction(async (tx: any) => {
        // Update employer balance
        await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'refund',
            amount, // Positive for refunds
            balanceBefore,
            balanceAfter,
            description: `Refund: ${reason}`,
            referenceId,
            metadata: {
              source: 'automatic_refund',
              reason,
              timestamp: new Date().toISOString()
            }
          }
        });
      });

      logger.info('Refund successful', {
        employerId,
        amount,
        newBalance: balanceAfter,
        reason
      });

      return balanceAfter;
    } catch (error: any) {
      logger.error('Refund failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Get balance history
   */
  async getTransactionHistory(
    employerId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const transactions = await prisma.balanceTransaction.findMany({
        where: { employerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.balanceTransaction.count({
        where: { employerId }
      });

      return {
        transactions,
        total,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Failed to get transaction history', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      const stats = await prisma.platformStats.findUnique({
        where: { id: 'platform' }
      });

      const employerCount = await prisma.employer.count({ where: { active: true } });
      const employeeCount = await prisma.employee.count({ where: { active: true } });

      if (!stats) {
        // Create initial stats
        return await prisma.platformStats.create({
          data: {
            id: 'platform',
            totalEmployers: employerCount,
            totalEmployees: employeeCount,
            updatedAt: new Date()
          }
        });
      }

      return {
        ...stats,
        totalEmployers: employerCount,
        totalEmployees: employeeCount
      };
    } catch (error: any) {
      logger.error('Failed to get platform stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if employer has sufficient balance
   */
  async hasSufficientBalance(employerId: string, requiredAmount: number): Promise<boolean> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        select: { virtualBalance: true }
      });

      if (!employer) {
        return false;
      }

      return Number(employer.virtualBalance) >= requiredAmount;
    } catch (error: any) {
      logger.error('Failed to check balance', { error: error.message, employerId });
      return false;
    }
  }
}

export const balanceService = new BalanceService();
