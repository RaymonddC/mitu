/**
 * Wallet Signing Controller
 * Handles HTTP requests for non-custodial wallet signing endpoints
 */

import { Request, Response } from 'express';
import { walletSigningService } from '../services/walletSigningService';
import { logger } from '../middleware/logger';
import { prisma } from '../server';

export class WalletSigningController {
  /**
   * Create a new payroll approval request
   * POST /api/wallet/approvals/create
   */
  async createApproval(req: Request, res: Response) {
    try {
      const { employerId, employees } = req.body;

      if (!employerId) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'employerId is required'
        });
      }

      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({
          error: 'Invalid employees',
          message: 'employees array is required and must not be empty'
        });
      }

      const approval = await walletSigningService.createPayrollApproval(
        employerId,
        employees
      );

      res.json({
        success: true,
        data: approval,
        message: 'Payroll approval created successfully'
      });
    } catch (error: any) {
      logger.error('Create approval endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to create approval',
        message: error.message
      });
    }
  }

  /**
   * Get approval details
   * GET /api/wallet/approvals/:approvalId
   */
  async getApproval(req: Request, res: Response) {
    try {
      const { approvalId } = req.params;

      const approval = await walletSigningService.getApproval(approvalId);

      res.json({
        success: true,
        data: approval
      });
    } catch (error: any) {
      logger.error('Get approval endpoint error', { error: error.message });
      res.status(404).json({
        error: 'Approval not found',
        message: error.message
      });
    }
  }

  /**
   * List pending approvals for an employer
   * GET /api/wallet/approvals?employerId=xxx&status=pending
   */
  async listApprovals(req: Request, res: Response) {
    try {
      const { employerId, status } = req.query;

      if (!employerId) {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'employerId query parameter is required'
        });
      }

      // For now, only support pending approvals
      const approvals = await walletSigningService.getPendingApprovals(
        employerId as string
      );

      res.json({
        success: true,
        data: approvals
      });
    } catch (error: any) {
      logger.error('List approvals endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to list approvals',
        message: error.message
      });
    }
  }

  /**
   * Validate approval before blockchain transaction
   * POST /api/wallet/approvals/:approvalId/validate
   */
  async validateApproval(req: Request, res: Response) {
    try {
      const { approvalId } = req.params;

      const approval = await walletSigningService.getApproval(approvalId);

      if (!approval) {
        return res.status(404).json({
          error: 'Approval not found',
          message: 'Approval not found'
        });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({
          error: 'Approval not pending',
          message: `Approval is ${approval.status}. Only pending approvals can be validated.`
        });
      }

      // Check if employees have already been paid today (BEFORE blockchain transaction)
      const today = new Date().toISOString().split('T')[0];
      const alreadyPaidEmployees: Array<{ name: string; amount: number; paidAt: Date }> = [];
      const recipients = approval.recipients as any[];

      const crypto = require('crypto');

      for (const recipient of recipients) {
        const idempotencyKey = crypto
          .createHash('sha256')
          .update(`${approval.employerId}-${recipient.employeeId}-${today}`)
          .digest('hex');

        const existingLog = await prisma.payrollLog.findUnique({
          where: { idempotencyKey }
        });

        if (existingLog) {
          alreadyPaidEmployees.push({
            name: recipient.name,
            amount: recipient.amount,
            paidAt: existingLog.executedAt
          });
        }
      }

      const allAlreadyPaid = alreadyPaidEmployees.length === recipients.length;
      const someAlreadyPaid = alreadyPaidEmployees.length > 0 && alreadyPaidEmployees.length < recipients.length;

      logger.info('Approval validation result', {
        approvalId,
        totalRecipients: recipients.length,
        alreadyPaidCount: alreadyPaidEmployees.length,
        allAlreadyPaid,
        someAlreadyPaid
      });

      res.json({
        success: true,
        data: {
          approvalId,
          valid: !allAlreadyPaid, // Only valid if not all already paid
          allAlreadyPaid,
          someAlreadyPaid,
          totalRecipients: recipients.length,
          alreadyPaidCount: alreadyPaidEmployees.length,
          alreadyPaidEmployees: alreadyPaidEmployees.length > 0 ? alreadyPaidEmployees : undefined
        }
      });
    } catch (error: any) {
      logger.error('Validate approval endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to validate approval',
        message: error.message
      });
    }
  }

  /**
   * Submit signed transaction
   * POST /api/wallet/approvals/:approvalId/submit
   */
  async submitSignedTransaction(req: Request, res: Response) {
    try {
      const { approvalId } = req.params;
      const { txHash } = req.body;

      if (!txHash) {
        return res.status(400).json({
          error: 'Missing transaction hash',
          message: 'txHash is required'
        });
      }

      const result = await walletSigningService.submitSignedTransaction(
        approvalId,
        txHash
      );

      res.json({
        success: true,
        data: result,
        message: 'Transaction submitted successfully'
      });
    } catch (error: any) {
      logger.error('Submit transaction endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to submit transaction',
        message: error.message
      });
    }
  }

  /**
   * Reject an approval
   * POST /api/wallet/approvals/:approvalId/reject
   */
  async rejectApproval(req: Request, res: Response) {
    try {
      const { approvalId } = req.params;
      const { reason } = req.body;

      const result = await walletSigningService.rejectApproval(
        approvalId,
        reason
      );

      res.json({
        success: true,
        data: result,
        message: 'Approval rejected'
      });
    } catch (error: any) {
      logger.error('Reject approval endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to reject approval',
        message: error.message
      });
    }
  }

  /**
   * Create a pre-approved budget
   * POST /api/wallet/budgets
   */
  async createBudget(req: Request, res: Response) {
    try {
      const { employerId, monthlyLimit, startDate, endDate, perEmployeeLimit } = req.body;

      if (!employerId || !monthlyLimit || !startDate || !endDate) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'employerId, monthlyLimit, startDate, and endDate are required'
        });
      }

      const budget = await walletSigningService.createBudget(
        employerId,
        parseFloat(monthlyLimit),
        new Date(startDate),
        new Date(endDate),
        perEmployeeLimit ? parseFloat(perEmployeeLimit) : undefined
      );

      res.json({
        success: true,
        data: budget,
        message: 'Budget created successfully'
      });
    } catch (error: any) {
      logger.error('Create budget endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to create budget',
        message: error.message
      });
    }
  }

  /**
   * Get employer's budgets
   * GET /api/wallet/budgets/:employerId
   */
  async getEmployerBudgets(req: Request, res: Response) {
    try {
      const { employerId } = req.params;

      const budgets = await walletSigningService.getEmployerBudgets(employerId);

      res.json({
        success: true,
        data: budgets
      });
    } catch (error: any) {
      logger.error('Get budgets endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to get budgets',
        message: error.message
      });
    }
  }

  /**
   * Check if amount is within budget authorization
   * POST /api/wallet/budgets/:employerId/check
   */
  async checkBudgetAuthorization(req: Request, res: Response) {
    try {
      const { employerId } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'amount must be a positive number'
        });
      }

      const authorized = await walletSigningService.checkBudgetAuthorization(
        employerId,
        parseFloat(amount)
      );

      res.json({
        success: true,
        data: {
          authorized,
          amount: parseFloat(amount)
        }
      });
    } catch (error: any) {
      logger.error('Check budget authorization error', { error: error.message });
      res.status(500).json({
        error: 'Failed to check authorization',
        message: error.message
      });
    }
  }
}

export const walletSigningController = new WalletSigningController();
