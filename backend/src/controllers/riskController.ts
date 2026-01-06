import { Request, Response, NextFunction } from 'express';
import { riskScreeningService } from '../services/riskScreeningService';
import { sanctionsChecker } from '../services/sanctionsChecker';
import { logger } from '../middleware/logger';
import { CustomError } from '../middleware/errorHandler';
import { z } from 'zod';

// Validation schemas
const screenWalletSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    skipCache: z.boolean().optional().default(false)
});

const batchScreenSchema = z.object({
    addresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(1).max(50)
});

/**
 * Screen a single wallet address
 * POST /api/risk/screen
 */
export async function screenWallet(req: Request, res: Response, next: NextFunction) {
    try {
        const { address, skipCache } = screenWalletSchema.parse(req.body);

        const result = await riskScreeningService.screenWallet(address, skipCache);

        res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return next(new CustomError(error.errors[0].message, 400));
        }
        next(error);
    }
}

/**
 * Screen multiple wallet addresses
 * POST /api/risk/screen/batch
 */
export async function batchScreenWallets(req: Request, res: Response, next: NextFunction) {
    try {
        const { addresses } = batchScreenSchema.parse(req.body);

        const results = await riskScreeningService.batchScreenWallets(addresses);

        // Convert Map to object for JSON response
        const resultsObject: Record<string, any> = {};
        results.forEach((value, key) => {
            resultsObject[key] = value;
        });

        // Summary statistics
        const summary = {
            total: addresses.length,
            screened: results.size,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            blocked: 0
        };

        results.forEach(result => {
            summary[result.riskLevel]++;
            if (result.action === 'block') summary.blocked++;
        });

        res.json({
            success: true,
            data: {
                results: resultsObject,
                summary
            }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return next(new CustomError(error.errors[0].message, 400));
        }
        next(error);
    }
}

/**
 * Quick sanctions check only
 * GET /api/risk/sanctions/:address
 */
export async function checkSanctions(req: Request, res: Response, next: NextFunction) {
    try {
        const { address } = req.params;

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new CustomError('Invalid Ethereum address', 400);
        }

        const result = await sanctionsChecker.checkSanctions(address);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Screen employees before payroll
 * POST /api/risk/screen-employees
 */
export async function screenEmployees(req: Request, res: Response, next: NextFunction) {
    try {
        const { employerId } = req.body;

        if (!employerId) {
            throw new CustomError('employerId is required', 400);
        }

        // Get all active employees
        const { prisma } = await import('../server');
        const employees = await prisma.employee.findMany({
            where: {
                employerId,
                active: true
            },
            select: {
                id: true,
                name: true,
                walletAddress: true,
                salaryAmount: true
            }
        });

        if (employees.length === 0) {
            return res.json({
                success: true,
                data: {
                    results: [],
                    summary: { total: 0, safe: 0, risky: 0, blocked: 0 }
                },
                message: 'No active employees found'
            });
        }

        // Screen all employee wallets
        const addresses = employees.map(emp => emp.walletAddress);
        const screeningResults = await riskScreeningService.batchScreenWallets(addresses);

        // Combine employee data with screening results
        const results = employees.map(employee => {
            const screening = screeningResults.get(employee.walletAddress.toLowerCase());
            return {
                employeeId: employee.id,
                employeeName: employee.name,
                walletAddress: employee.walletAddress,
                salaryAmount: Number(employee.salaryAmount),
                riskScore: screening?.finalScore || 0,
                riskLevel: screening?.riskLevel || 'unknown',
                action: screening?.action || 'unknown',
                summary: screening?.summary || 'Unable to screen',
                canPayroll: screening?.action === 'proceed' || screening?.action === 'warn'
            };
        });

        // Summary
        const summary = {
            total: employees.length,
            safe: results.filter(r => r.action === 'proceed').length,
            risky: results.filter(r => r.action === 'warn').length,
            blocked: results.filter(r => r.action === 'block').length,
            totalSalary: results.reduce((sum, r) => sum + r.salaryAmount, 0),
            blockedSalary: results.filter(r => r.action === 'block')
                .reduce((sum, r) => sum + r.salaryAmount, 0)
        };

        // Create alerts for high-risk employees
        const riskyEmployees = results.filter(r => r.action === 'block' || r.riskLevel === 'high');

        for (const emp of riskyEmployees) {
            const screening = screeningResults.get(emp.walletAddress.toLowerCase());
            if (screening) {
                await prisma.alert.create({
                    data: {
                        employerId,
                        severity: screening.action === 'block' ? 'critical' : 'warning',
                        category: 'risk_screening',
                        title: `High Risk Employee Detected: ${emp.employeeName}`,
                        message: screening.summary,
                        metadata: {
                            employeeId: emp.employeeId,
                            employeeName: emp.employeeName,
                            walletAddress: emp.walletAddress,
                            riskScore: screening.finalScore,
                            riskLevel: screening.riskLevel,
                            action: screening.action,
                            recommendations: screening.recommendations
                        }
                    }
                });
            }
        }

        logger.info('Employee screening completed', {
            employerId,
            total: employees.length,
            blocked: summary.blocked,
            risky: summary.risky
        });

        res.json({
            success: true,
            data: {
                results,
                summary
            },
            message: summary.blocked > 0
                ? `⚠️ ${summary.blocked} employee(s) blocked due to high risk`
                : summary.risky > 0
                    ? `⚠️ ${summary.risky} employee(s) flagged as risky`
                    : '✅ All employees cleared for payroll'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get risk screening statistics
 * GET /api/risk/stats
 */
export async function getRiskStats(_req: Request, res: Response, next: NextFunction) {
    try {
        const { prisma } = await import('../server');

        // Get all risk screening records from database
        const totalScreenings = await prisma.riskScreening.count();
        const blockedCount = await prisma.riskScreening.count({
            where: { blocked: true }
        });

        // Get risk level distribution
        const riskLevels = await prisma.riskScreening.groupBy({
            by: ['riskLevel'],
            _count: true
        });

        // Cache stats
        const cacheStats = riskScreeningService.getCacheStats();

        res.json({
            success: true,
            data: {
                totalScreenings,
                blockedCount,
                blockedPercentage: totalScreenings > 0
                    ? ((blockedCount / totalScreenings) * 100).toFixed(2)
                    : '0.00',
                riskLevels: riskLevels.reduce((acc, level) => {
                    acc[level.riskLevel] = level._count;
                    return acc;
                }, {} as Record<string, number>),
                cache: cacheStats
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Clear risk screening cache
 * POST /api/risk/cache/clear
 */
export async function clearCache(req: Request, res: Response, next: NextFunction) {
    try {
        const { address } = req.body;

        if (address) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                throw new CustomError('Invalid Ethereum address', 400);
            }
            riskScreeningService.clearCache(address);
            sanctionsChecker.clearCache();
        } else {
            riskScreeningService.clearCache();
            sanctionsChecker.clearCache();
        }

        res.json({
            success: true,
            message: address
                ? `Cache cleared for address ${address}`
                : 'All risk screening cache cleared'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Add address to custom blacklist
 * POST /api/risk/blacklist/add
 */
export async function addToBlacklist(req: Request, res: Response, next: NextFunction) {
    try {
        const { address, reason } = req.body;

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new CustomError('Invalid Ethereum address', 400);
        }

        sanctionsChecker.addToBlacklist(address, reason || 'Custom');

        logger.info('Address added to blacklist', { address, reason });

        res.json({
            success: true,
            message: `Address ${address} added to blacklist`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Remove address from custom blacklist
 * POST /api/risk/blacklist/remove
 */
export async function removeFromBlacklist(req: Request, res: Response, next: NextFunction) {
    try {
        const { address } = req.body;

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new CustomError('Invalid Ethereum address', 400);
        }

        sanctionsChecker.removeFromBlacklist(address);

        logger.info('Address removed from blacklist', { address });

        res.json({
            success: true,
            message: `Address ${address} removed from blacklist`
        });
    } catch (error) {
        next(error);
    }
}