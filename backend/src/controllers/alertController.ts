/**
 * Alert Controller
 * Handles AI agent alerts and notifications
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { CustomError } from '../middleware/errorHandler';

/**
 * Get alerts for employer
 */
export async function getAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const { employerId, severity, resolved } = req.query;

    if (!employerId || typeof employerId !== 'string') {
      throw new CustomError('employerId query parameter is required', 400);
    }

    const alerts = await prisma.alert.findMany({
      where: {
        employerId,
        ...(severity && { severity: severity as string }),
        ...(resolved !== undefined && { resolved: resolved === 'true' })
      },
      orderBy: [
        { resolved: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve alert
 */
export async function resolveAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Alert resolved',
      data: alert
    });
  } catch (error) {
    next(error);
  }
}
