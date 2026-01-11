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
  profileImage: z.string().optional(),
  payrollDay: z.number().min(1).max(28).default(28),
  monthlyBudget: z.number().positive().optional()
});

const updateEmployerSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  profileImage: z.string().optional(),
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

    // Check if company name already exists for this wallet (since wallet can have multiple companies)
    const existing = await prisma.employer.findFirst({
      where: {
        walletAddress: {
          equals: data.walletAddress,
          mode: 'insensitive'
        },
        companyName: {
          equals: data.companyName,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      throw new CustomError('A company with this name already exists for your wallet', 409);
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
 * Case-insensitive lookup (Ethereum addresses can be checksummed or lowercase)
 */
export async function getEmployer(req: Request, res: Response, next: NextFunction) {
  try {
    const { walletAddress } = req.params;

    // Ethereum addresses are case-insensitive, so normalize to lowercase for comparison
    const normalizedAddress = walletAddress.toLowerCase();

    const employer = await prisma.employer.findFirst({
      where: {
        walletAddress: {
          equals: normalizedAddress,
          mode: 'insensitive'
        },
        isDeleted: false
      },
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

/**
 * List all employers
 * GET /api/employers
 */
export async function listEmployers(req: Request, res: Response, next: NextFunction) {
  try {
    const employers = await prisma.employer.findMany({
      where: {
        active: true,
        isDeleted: false
      },
      include: {
        employees: {
          where: { active: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate total monthly payroll for each employer
    const employersWithPayroll = employers.map(employer => ({
      ...employer,
      totalMonthlyPayroll: employer.employees.reduce(
        (sum, emp) => sum + Number(emp.salaryAmount),
        0
      )
    }));

    res.json({
      success: true,
      data: employersWithPayroll
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete employer (soft delete)
 * DELETE /api/employers/:id
 */
export async function deleteEmployer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Verify employer exists and is not already deleted
    const employer = await prisma.employer.findUnique({
      where: { id }
    });

    if (!employer) {
      throw new CustomError('Employer not found', 404);
    }

    if (employer.isDeleted) {
      throw new CustomError('Employer is already deleted', 400);
    }

    // Soft delete by setting isDeleted flag
    const deletedEmployer = await prisma.employer.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        active: false
      }
    });

    res.json({
      success: true,
      message: 'Company deleted successfully',
      data: deletedEmployer
    });
  } catch (error) {
    next(error);
  }
}
