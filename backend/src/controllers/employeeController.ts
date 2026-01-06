/**
 * Employee Controller
 * Handles employee CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { CustomError } from '../middleware/errorHandler';
import { z } from 'zod';
import { logger } from '../middleware/logger';

// Validation schemas
const createEmployeeSchema = z.object({
  employerId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  walletAddress: z.string().min(20),
  salaryAmount: z.number().positive(),
  paymentCycle: z.enum(['monthly', 'weekly', 'custom']).default('monthly'),
  customPayDay: z.number().min(1).max(28).optional(),
  profileImage: z.string().optional(),
  notes: z.string().max(1000).optional()
});

const updateEmployeeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  profileImage: z.string().optional(),
  walletAddress: z.string().min(20).optional(),
  salaryAmount: z.number().positive().optional(),
  paymentCycle: z.enum(['monthly', 'weekly', 'custom']).optional(),
  customPayDay: z.number().min(1).max(28).optional(),
  active: z.boolean().optional(),
  notes: z.string().max(1000).optional()
});

/**
 * Create new employee
 */
export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEmployeeSchema.parse(req.body);

    // Verify employer exists
    const employer = await prisma.employer.findUnique({
      where: { id: data.employerId }
    });

    if (!employer) {
      throw new CustomError('Employer not found', 404);
    }

    // Check for duplicate wallet address within same employer
    const existing = await prisma.employee.findFirst({
      where: {
        employerId: data.employerId,
        walletAddress: data.walletAddress,
        active: true
      }
    });

    if (existing) {
      throw new CustomError('Employee with this wallet address already exists', 409);
    }

    // Create alert if salary seems suspicious (AI guard check)
    if (data.salaryAmount > 50000) {
      await prisma.alert.create({
        data: {
          employerId: data.employerId,
          severity: 'warning',
          category: 'suspicious_change',
          title: 'High Salary Amount Detected',
          message: `New employee ${data.name} has salary of ${data.salaryAmount} MNEE. Please verify this is correct.`,
          metadata: { employeeName: data.name, amount: data.salaryAmount }
        }
      });
      logger.warn(`High salary detected for employee ${data.name}: ${data.salaryAmount}`);
    }

    const employee = await prisma.employee.create({
      data: {
        employerId: data.employerId,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage,
        walletAddress: data.walletAddress,
        salaryAmount: data.salaryAmount,
        paymentCycle: data.paymentCycle,
        customPayDay: data.customPayDay,
        notes: data.notes
      }
    });

    logger.info(`Employee created: ${employee.id} for employer ${data.employerId}`);

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all employees for an employer
 */
export async function getEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId } = req.query;

    if (!employerId || typeof employerId !== 'string') {
      throw new CustomError('employerId query parameter is required', 400);
    }

    const employees = await prisma.employee.findMany({
      where: {
        employerId,
        active: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single employee
 */
export async function getEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            companyName: true,
            payrollDay: true
          }
        },
        payrollLogs: {
          orderBy: { executedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!employee) {
      throw new CustomError('Employee not found', 404);
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update employee
 */
export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateEmployeeSchema.parse(req.body);

    // Get current employee data for comparison
    const currentEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!currentEmployee) {
      throw new CustomError('Employee not found', 404);
    }

    // AI Guard: Check for suspicious salary changes
    if (data.salaryAmount && data.salaryAmount !== Number(currentEmployee.salaryAmount)) {
      const changePercent = Math.abs(
        (data.salaryAmount - Number(currentEmployee.salaryAmount)) /
        Number(currentEmployee.salaryAmount) * 100
      );

      if (changePercent > 50) {
        await prisma.alert.create({
          data: {
            employerId: currentEmployee.employerId,
            severity: 'warning',
            category: 'suspicious_change',
            title: 'Large Salary Change Detected',
            message: `Employee ${currentEmployee.name} salary changed from ${currentEmployee.salaryAmount} to ${data.salaryAmount} (${changePercent.toFixed(1)}% change)`,
            metadata: {
              employeeId: id,
              oldAmount: currentEmployee.salaryAmount,
              newAmount: data.salaryAmount,
              changePercent
            }
          }
        });
        logger.warn(`Large salary change for employee ${id}: ${changePercent.toFixed(1)}%`);
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data
    });

    logger.info(`Employee updated: ${id}`);

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete (deactivate) employee
 */
export async function deleteEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.update({
      where: { id },
      data: { active: false }
    });

    logger.info(`Employee deactivated: ${id}`);

    res.json({
      success: true,
      message: 'Employee deactivated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
}
