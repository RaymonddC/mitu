/**
 * Payroll Controller
 * Handles payroll execution and history
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { CustomError } from '../middleware/errorHandler';
import { z } from 'zod';
import { logger } from '../middleware/logger';
import { MNEEService } from '../services/mneeService';
import crypto from 'crypto';

const mneeService = new MNEEService();

// Validation schemas
const runPayrollSchema = z.object({
  employerId: z.string().uuid(),
  employeeIds: z.array(z.string().uuid()).optional(), // If empty, run for all active employees
  testMode: z.boolean().default(false)
});

/**
 * Run payroll manually
 * This is the "Run Payroll Now" button action
 */
export async function runPayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const data = runPayrollSchema.parse(req.body);

    // Get employer
    const employer = await prisma.employer.findUnique({
      where: { id: data.employerId },
      include: {
        employees: {
          where: {
            active: true,
            ...(data.employeeIds && { id: { in: data.employeeIds } })
          }
        }
      }
    });

    if (!employer) {
      throw new CustomError('Employer not found', 404);
    }

    if (employer.employees.length === 0) {
      throw new CustomError('No active employees found', 400);
    }

    // Calculate total amount needed
    const totalAmount = employer.employees.reduce(
      (sum, emp) => sum + Number(emp.salaryAmount),
      0
    );

    // AI Guard: Check employer balance
    try {
      const balance = await mneeService.getBalance(employer.walletAddress);

      if (balance < totalAmount) {
        await prisma.alert.create({
          data: {
            employerId: employer.id,
            severity: 'critical',
            category: 'insufficient_funds',
            title: 'Insufficient Funds for Payroll',
            message: `Employer wallet has ${balance} MNEE but needs ${totalAmount} MNEE to complete payroll`,
            metadata: { balance, required: totalAmount, deficit: totalAmount - balance }
          }
        });

        throw new CustomError(
          `Insufficient funds: need ${totalAmount} MNEE, have ${balance} MNEE`,
          400
        );
      }
    } catch (error: any) {
      logger.error('Failed to check employer balance', { error: error.message });
      // Continue anyway if balance check fails (might be in test mode)
      if (!data.testMode) {
        throw error;
      }
    }

    // Execute payroll for each employee
    const results = [];

    for (const employee of employer.employees) {
      // Generate idempotency key
      const idempotencyKey = crypto
        .createHash('sha256')
        .update(`${employer.id}-${employee.id}-${new Date().toISOString().split('T')[0]}`)
        .digest('hex');

      // Check if already paid today
      const existingLog = await prisma.payrollLog.findUnique({
        where: { idempotencyKey }
      });

      if (existingLog && existingLog.status === 'completed') {
        logger.info(`Employee ${employee.id} already paid today`);
        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          status: 'skipped',
          reason: 'Already paid today'
        });
        continue;
      }

      try {
        // Create pending log
        const payrollLog = await prisma.payrollLog.create({
          data: {
            employerId: employer.id,
            employeeId: employee.id,
            amount: employee.salaryAmount,
            status: 'pending',
            idempotencyKey
          }
        });

        // Execute salary transfer via MNEE Flow Contract
        let txHash: string | undefined;

        if (!data.testMode) {
          txHash = await mneeService.executeSalaryTransfer(
            employer.walletAddress,
            employee.walletAddress,
            Number(employee.salaryAmount)
          );
        } else {
          // Test mode: simulate transaction
          txHash = `test_${crypto.randomBytes(16).toString('hex')}`;
          logger.info('Test mode: simulated transaction', { txHash });
        }

        // Update log with success
        await prisma.payrollLog.update({
          where: { id: payrollLog.id },
          data: {
            status: 'completed',
            txHash,
            confirmedAt: new Date(),
            metadata: {
              testMode: data.testMode,
              employeeName: employee.name
            }
          }
        });

        logger.info(`Payroll executed for employee ${employee.id}`, { txHash });

        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          amount: Number(employee.salaryAmount),
          status: 'success',
          txHash
        });

      } catch (error: any) {
        logger.error(`Payroll failed for employee ${employee.id}`, { error: error.message });

        // Update log with failure
        await prisma.payrollLog.updateMany({
          where: {
            employeeId: employee.id,
            idempotencyKey,
            status: 'pending'
          },
          data: {
            status: 'failed',
            failureReason: error.message
          }
        });

        // Create alert
        await prisma.alert.create({
          data: {
            employerId: employer.id,
            severity: 'critical',
            category: 'invalid_wallet',
            title: 'Payroll Execution Failed',
            message: `Failed to pay ${employee.name}: ${error.message}`,
            metadata: { employeeId: employee.id, error: error.message }
          }
        });

        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Summary
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    logger.info('Payroll run completed', {
      employerId: employer.id,
      total: results.length,
      success: successCount,
      failed: failedCount,
      skipped: skippedCount
    });

    res.json({
      success: true,
      message: `Payroll executed: ${successCount} succeeded, ${failedCount} failed, ${skippedCount} skipped`,
      data: {
        totalEmployees: results.length,
        successCount,
        failedCount,
        skippedCount,
        results
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get payroll history
 */
export async function getPayrollHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId } = req.query;

    if (!employerId || typeof employerId !== 'string') {
      throw new CustomError('employerId query parameter is required', 400);
    }

    const logs = await prisma.payrollLog.findMany({
      where: { employerId },
      include: {
        employee: {
          select: {
            name: true,
            walletAddress: true
          }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 100
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single payroll log
 */
export async function getPayrollLog(req: Request, res: Response, next: NextFunction) {
  try {
    const { logId } = req.params;

    const log = await prisma.payrollLog.findUnique({
      where: { id: logId },
      include: {
        employee: true,
        employer: {
          select: {
            companyName: true,
            walletAddress: true
          }
        }
      }
    });

    if (!log) {
      throw new CustomError('Payroll log not found', 404);
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retry failed payroll
 */
export async function retryFailedPayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const { logId } = req.params;

    const log = await prisma.payrollLog.findUnique({
      where: { id: logId },
      include: {
        employee: true,
        employer: true
      }
    });

    if (!log) {
      throw new CustomError('Payroll log not found', 404);
    }

    if (log.status === 'completed') {
      throw new CustomError('This payroll has already been completed', 400);
    }

    if (log.retryCount >= 3) {
      throw new CustomError('Maximum retry attempts exceeded', 400);
    }

    // Update status to retrying
    await prisma.payrollLog.update({
      where: { id: logId },
      data: {
        status: 'retrying',
        retryCount: log.retryCount + 1
      }
    });

    try {
      // Attempt transfer again
      const txHash = await mneeService.executeSalaryTransfer(
        log.employer.walletAddress,
        log.employee.walletAddress,
        Number(log.amount)
      );

      // Update with success
      await prisma.payrollLog.update({
        where: { id: logId },
        data: {
          status: 'completed',
          txHash,
          confirmedAt: new Date()
        }
      });

      logger.info(`Retry successful for payroll log ${logId}`, { txHash });

      res.json({
        success: true,
        message: 'Payroll retry successful',
        data: { txHash }
      });

    } catch (error: any) {
      // Update with failure
      await prisma.payrollLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          failureReason: error.message
        }
      });

      throw new CustomError(`Retry failed: ${error.message}`, 500);
    }

  } catch (error) {
    next(error);
  }
}
