/**
 * Wallet Signing Service
 * Handles non-custodial wallet signing for payroll transactions
 * Week 2: Unsigned transaction creation, approval management, budget authorization
 */

import { prisma } from '../server';
import { logger } from '../middleware/logger';
import { ethereumService } from './ethereumService';

export class WalletSigningService {
  /**
   * Create unsigned transaction for payroll (approval request)
   */
  async createPayrollApproval(
    employerId: string,
    employees: Array<{
      id: string;
      name: string;
      walletAddress: string;
      salaryAmount: number;
    }>
  ) {
    try {
      // Calculate total amount
      const totalAmount = employees.reduce((sum, emp) => sum + emp.salaryAmount, 0);

      // Prepare recipients list
      const recipients = employees.map(emp => ({
        employeeId: emp.id,
        name: emp.name,
        address: emp.walletAddress,
        amount: emp.salaryAmount
      }));

      // For Ethereum, we create transaction parameters that the wallet will sign
      // The frontend will use these to create the actual transaction with wagmi/viem
      const unsignedTxData = {
        type: 'payroll',
        recipients: employees.map(emp => ({
          to: emp.walletAddress,
          amount: emp.salaryAmount
        })),
        totalAmount,
        tokenAddress: process.env.MNEE_TOKEN_ADDRESS,
        timestamp: new Date().toISOString()
      };

      // Set expiration (15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Create approval request in database
      const approval = await prisma.payrollApproval.create({
        data: {
          employerId,
          status: 'pending',
          unsignedTx: JSON.stringify(unsignedTxData),
          totalAmount,
          recipientCount: employees.length,
          recipients,
          expiresAt,
          description: `Monthly payroll for ${employees.length} employee${employees.length > 1 ? 's' : ''}`,
          metadata: {
            createdBy: 'autonomous_agent',
            version: '2.0',
            mode: 'non_custodial'
          }
        }
      });

      logger.info('Payroll approval created', {
        approvalId: approval.id,
        employerId,
        totalAmount,
        recipientCount: employees.length
      });

      return {
        approvalId: approval.id,
        unsignedTx: unsignedTxData,
        totalAmount,
        recipientCount: employees.length,
        recipients: employees,
        expiresAt,
        status: 'pending'
      };
    } catch (error: any) {
      logger.error('Failed to create payroll approval', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Get approval details
   */
  async getApproval(approvalId: string) {
    try {
      const approval = await prisma.payrollApproval.findUnique({
        where: { id: approvalId },
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              walletAddress: true
            }
          }
        }
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      // Parse unsigned tx data
      const unsignedTxData = approval.unsignedTx ? JSON.parse(approval.unsignedTx) : null;

      return {
        ...approval,
        unsignedTx: unsignedTxData,
        totalAmount: Number(approval.totalAmount),
        usedThisMonth: Number(approval.metadata && typeof approval.metadata === 'object' && 'usedThisMonth' in approval.metadata ? approval.metadata.usedThisMonth : 0)
      };
    } catch (error: any) {
      logger.error('Failed to get approval', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * List pending approvals for an employer
   */
  async getPendingApprovals(employerId: string) {
    try {
      const approvals = await prisma.payrollApproval.findMany({
        where: {
          employerId,
          status: 'pending',
          expiresAt: { gt: new Date() } // Only non-expired
        },
        orderBy: { createdAt: 'desc' }
      });

      return approvals.map(approval => ({
        ...approval,
        totalAmount: Number(approval.totalAmount),
        unsignedTx: approval.unsignedTx ? JSON.parse(approval.unsignedTx) : null
      }));
    } catch (error: any) {
      logger.error('Failed to get pending approvals', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Submit signed transaction from wallet
   */
  async submitSignedTransaction(approvalId: string, txHash: string) {
    try {
      const approval = await prisma.payrollApproval.findUnique({
        where: { id: approvalId }
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== 'pending') {
        throw new Error(`Approval already ${approval.status}`);
      }

      // Check if expired
      if (new Date() > approval.expiresAt) {
        await prisma.payrollApproval.update({
          where: { id: approvalId },
          data: { status: 'expired' }
        });
        throw new Error('Approval expired - please create a new transaction');
      }

      // Update approval as approved with transaction hash
      const updatedApproval = await prisma.payrollApproval.update({
        where: { id: approvalId },
        data: {
          status: 'approved',
          signedTx: txHash, // Store the transaction hash
          txHash,
          approvedAt: new Date(),
          broadcastedAt: new Date()
        }
      });

      // Create PayrollLog records for each employee
      // Parse transaction hashes (comma-separated if multiple employees)
      const txHashes = txHash.split(',');
      const recipients = approval.recipients as any[];

      logger.info('Starting PayrollLog creation', {
        approvalId,
        totalRecipients: recipients.length,
        txHashCount: txHashes.length,
        employerId: approval.employerId
      });

      const createdLogs: any[] = [];
      const skippedLogs: any[] = [];

      // Create individual PayrollLog records for payment history
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const employeeTxHash = txHashes[i] || txHashes[0]; // Use corresponding hash or first one

        try {
          // Generate idempotency key to prevent duplicates (must match format in payrollController)
          const date = new Date().toISOString().split('T')[0];
          const crypto = require('crypto');
          const idempotencyKey = crypto
            .createHash('sha256')
            .update(`${approval.employerId}-${recipient.employeeId}-${date}`)
            .digest('hex');

          logger.info('Attempting PayrollLog creation', {
            index: i,
            employerId: approval.employerId,
            employeeId: recipient.employeeId,
            amount: recipient.amount,
            amountType: typeof recipient.amount,
            idempotencyKey,
            txHash: employeeTxHash
          });

          // Check if log already exists (duplicate payment detection)
          const existingLog = await prisma.payrollLog.findUnique({
            where: { idempotencyKey }
          });

          let finalIdempotencyKey = idempotencyKey;
          let isDuplicate = false;

          if (existingLog) {
            // CRITICAL: Transaction already executed on blockchain!
            // We MUST create a log even if it's a duplicate payment
            logger.error('⚠️  DUPLICATE PAYMENT DETECTED - Employee already paid today but transaction was executed!', {
              idempotencyKey,
              existingLogId: existingLog.id,
              existingLogCreated: existingLog.executedAt,
              employeeName: recipient.name,
              employeeId: recipient.employeeId,
              amount: recipient.amount,
              newTxHash: employeeTxHash
            });

            // Modify idempotency key to allow duplicate log creation
            // Format: original_key + timestamp to make it unique
            finalIdempotencyKey = `${idempotencyKey}-duplicate-${Date.now()}`;
            isDuplicate = true;

            // Still track that it was skipped in the sense of being a duplicate
            skippedLogs.push({
              employeeId: recipient.employeeId,
              employeeName: recipient.name,
              amount: recipient.amount,
              reason: 'Duplicate payment - already paid today',
              existingLogId: existingLog.id,
              existingLogDate: existingLog.executedAt
            });
          }

          const newLog = await prisma.payrollLog.create({
            data: {
              employerId: approval.employerId,
              employeeId: recipient.employeeId,
              amount: Number(recipient.amount), // Ensure it's a number
              txHash: employeeTxHash,
              status: 'completed',
              idempotencyKey: finalIdempotencyKey, // Use modified key for duplicates
              confirmedAt: new Date(),
              metadata: {
                approvalId,
                walletSigned: true,
                recipient: recipient.address,
                isDuplicate, // Flag if this is a duplicate payment
                ...(isDuplicate && {
                  duplicateWarning: 'This employee was already paid today',
                  originalIdempotencyKey: idempotencyKey,
                  existingLogId: existingLog?.id
                })
              }
            }
          });

          if (isDuplicate) {
            logger.warn('⚠️  PayrollLog created for DUPLICATE PAYMENT', {
              logId: newLog.id,
              employeeId: recipient.employeeId,
              employeeName: recipient.name,
              amount: newLog.amount,
              executedAt: newLog.executedAt,
              idempotencyKey: newLog.idempotencyKey,
              originalLogId: existingLog?.id,
              warning: 'Employee was paid twice today!'
            });
          } else {
            logger.info('✅ PayrollLog created successfully', {
              logId: newLog.id,
              employeeId: recipient.employeeId,
              amount: newLog.amount,
              executedAt: newLog.executedAt,
              idempotencyKey: newLog.idempotencyKey
            });
          }

          createdLogs.push({
            logId: newLog.id,
            employeeId: recipient.employeeId,
            employeeName: recipient.name,
            amount: newLog.amount,
            isDuplicate, // Flag duplicate payments
            ...(isDuplicate && { originalLogId: existingLog?.id })
          });

        } catch (logError: any) {
          logger.error('❌ Failed to create PayrollLog', {
            error: logError.message,
            stack: logError.stack,
            employeeId: recipient.employeeId,
            approvalId,
            recipientData: recipient
          });

          skippedLogs.push({
            employeeId: recipient.employeeId,
            employeeName: recipient.name,
            amount: recipient.amount,
            reason: `Error: ${logError.message}`
          });

          // Continue with other employees even if one fails
        }
      }

      logger.info('Finished PayrollLog creation loop', {
        approvalId,
        totalRecipients: recipients.length,
        created: createdLogs.length,
        skipped: skippedLogs.length
      });

      // Log warning if any were skipped
      if (skippedLogs.length > 0) {
        logger.warn('⚠️  Some PayrollLogs were skipped!', {
          skippedCount: skippedLogs.length,
          skippedEmployees: skippedLogs.map(s => s.employeeName),
          details: skippedLogs
        });
      }

      logger.info('Signed transaction submitted and PayrollLog records created', {
        approvalId,
        txHash,
        employerId: approval.employerId,
        recipientCount: recipients.length,
        logsCreated: createdLogs.length,
        logsSkipped: skippedLogs.length
      });

      return {
        approvalId,
        txHash,
        status: 'approved',
        approval: updatedApproval,
        logsCreated: createdLogs.length,
        logsSkipped: skippedLogs.length,
        createdLogs,
        skippedLogs
      };
    } catch (error: any) {
      logger.error('Failed to submit signed transaction', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Reject an approval
   */
  async rejectApproval(approvalId: string, reason?: string) {
    try {
      const approval = await prisma.payrollApproval.findUnique({
        where: { id: approvalId }
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== 'pending') {
        throw new Error(`Approval already ${approval.status}`);
      }

      await prisma.payrollApproval.update({
        where: { id: approvalId },
        data: {
          status: 'rejected',
          metadata: {
            ...((approval.metadata as any) || {}),
            rejectionReason: reason || 'Rejected by employer',
            rejectedAt: new Date().toISOString()
          }
        }
      });

      logger.info('Approval rejected', {
        approvalId,
        employerId: approval.employerId,
        reason
      });

      return {
        approvalId,
        status: 'rejected'
      };
    } catch (error: any) {
      logger.error('Failed to reject approval', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Check if payroll is within pre-approved budget
   */
  async checkBudgetAuthorization(employerId: string, amount: number): Promise<boolean> {
    try {
      // Find active budget for employer
      const budget = await prisma.payrollBudget.findFirst({
        where: {
          employerId,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      if (!budget) {
        return false; // No active budget = no authorization
      }

      // Check if we're in a new month - reset if so
      const now = new Date();
      const lastReset = new Date(budget.lastResetAt);

      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        await prisma.payrollBudget.update({
          where: { id: budget.id },
          data: {
            usedThisMonth: 0,
            lastResetAt: now
          }
        });

        // Budget was just reset, so check against full limit
        return amount <= Number(budget.monthlyLimit);
      }

      // Check if amount is within remaining budget
      const remaining = Number(budget.monthlyLimit) - Number(budget.usedThisMonth);
      return amount <= remaining;
    } catch (error: any) {
      logger.error('Budget authorization check failed', {
        error: error.message,
        employerId,
        amount
      });
      return false;
    }
  }

  /**
   * Update budget usage after successful payroll
   */
  async updateBudgetUsage(employerId: string, amount: number) {
    try {
      const budget = await prisma.payrollBudget.findFirst({
        where: {
          employerId,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      if (budget) {
        await prisma.payrollBudget.update({
          where: { id: budget.id },
          data: {
            usedThisMonth: { increment: amount }
          }
        });

        logger.info('Budget usage updated', {
          employerId,
          amount,
          budgetId: budget.id
        });
      }
    } catch (error: any) {
      logger.error('Failed to update budget usage', {
        error: error.message,
        employerId,
        amount
      });
    }
  }

  /**
   * Create or update pre-approved budget
   */
  async createBudget(
    employerId: string,
    monthlyLimit: number,
    startDate: Date,
    endDate: Date,
    perEmployeeLimit?: number
  ) {
    try {
      const budget = await prisma.payrollBudget.create({
        data: {
          employerId,
          monthlyLimit,
          perEmployeeLimit: perEmployeeLimit || null,
          startDate,
          endDate,
          isActive: true
        }
      });

      logger.info('Payroll budget created', {
        budgetId: budget.id,
        employerId,
        monthlyLimit
      });

      return budget;
    } catch (error: any) {
      logger.error('Failed to create budget', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Get employer's active budgets
   */
  async getEmployerBudgets(employerId: string) {
    try {
      const budgets = await prisma.payrollBudget.findMany({
        where: { employerId },
        orderBy: { createdAt: 'desc' }
      });

      return budgets.map(budget => ({
        ...budget,
        monthlyLimit: Number(budget.monthlyLimit),
        perEmployeeLimit: budget.perEmployeeLimit ? Number(budget.perEmployeeLimit) : null,
        usedThisMonth: Number(budget.usedThisMonth)
      }));
    } catch (error: any) {
      logger.error('Failed to get employer budgets', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Expire old pending approvals (run periodically)
   */
  async expireOldApprovals() {
    try {
      const result = await prisma.payrollApproval.updateMany({
        where: {
          status: 'pending',
          expiresAt: { lt: new Date() }
        },
        data: {
          status: 'expired'
        }
      });

      if (result.count > 0) {
        logger.info('Expired old approvals', { count: result.count });
      }

      return result.count;
    } catch (error: any) {
      logger.error('Failed to expire old approvals', {
        error: error.message
      });
      throw error;
    }
  }
}

export const walletSigningService = new WalletSigningService();
