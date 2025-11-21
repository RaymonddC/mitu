/**
 * Employer Controller
 * Handles employer account management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { CustomError } from '../middleware/errorHandler';
import { z } from 'zod';

// Validation schemas
const createEmployerSchema = z.object({
  walletAddress: z.string().min(20),
  companyName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  payrollDay: z.number().min(1).max(28).default(28),
  monthlyBudget: z.number().positive().optional()
});

const updateEmployerSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  payrollDay: z.number().min(1).max(28).optional(),
  monthlyBudget: z.number().positive().optional(),
  active: z.boolean().optional()
});

/**
 * Create new employer
 */
export async function createEmployer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEmployerSchema.parse(req.body);

    // Check if employer already exists
    const existing = await prisma.employer.findUnique({
      where: { walletAddress: data.walletAddress }
    });

    if (existing) {
      throw new CustomError('Employer with this wallet address already exists', 409);
    }

    const employer = await prisma.employer.create({
      data: {
        walletAddress: data.walletAddress,
        companyName: data.companyName,
        email: data.email,
        payrollDay: data.payrollDay,
        monthlyBudget: data.monthlyBudget
      },
      include: {
        employees: true
      }
    });

    res.status(201).json({
      success: true,
      data: employer
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get employer by wallet address
 */
export async function getEmployer(req: Request, res: Response, next: NextFunction) {
  try {
    const { walletAddress } = req.params;

    const employer = await prisma.employer.findUnique({
      where: { walletAddress },
      include: {
        employees: {
          where: { active: true }
        },
        alerts: {
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!employer) {
      throw new CustomError('Employer not found', 404);
    }

    // Calculate total monthly payroll
    const totalMonthlyPayroll = employer.employees.reduce(
      (sum, emp) => sum + Number(emp.salaryAmount),
      0
    );

    res.json({
      success: true,
      data: {
        ...employer,
        totalMonthlyPayroll
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update employer
 */
export async function updateEmployer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateEmployerSchema.parse(req.body);

    const employer = await prisma.employer.update({
      where: { id },
      data,
      include: {
        employees: true
      }
    });

    res.json({
      success: true,
      data: employer
    });
  } catch (error) {
    next(error);
  }
}
