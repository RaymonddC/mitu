import { riskScreeningService } from './riskScreeningService';
import { logger } from '../middleware/logger';
import { RiskAction } from '../types/risk.types';

/**
 * Hook: Pre-payroll risk screening
 * Call this BEFORE executing payroll
 *
 * @example
 * const canProceed = await prePayrollScreening(employerId);
 * if (!canProceed.safe) {
 *   // Handle blocked employees
 * }
 */
export async function prePayrollScreening(employerId: string) {
    try {
        const { prisma } = await import('../server');

        logger.info('Running pre-payroll risk screening', { employerId });

        // Get all active employees
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
            return {
                safe: true,
                blockedEmployees: [],
                riskyEmployees: [],
                safeEmployees: [],
                message: 'No employees to screen'
            };
        }

        // Screen all employee wallets
        const addresses = employees.map(emp => emp.walletAddress);
        const screeningResults = await riskScreeningService.batchScreenWallets(addresses);

        // Categorize employees
        const blockedEmployees = [];
        const riskyEmployees = [];
        const safeEmployees = [];

        for (const employee of employees) {
            const screening = screeningResults.get(employee.walletAddress.toLowerCase());

            if (!screening) {
                logger.warn('No screening result for employee', {
                    employeeId: employee.id,
                    name: employee.name
                });
                continue;
            }

            // Save screening to database
            await prisma.riskScreening.create({
                data: {
                    walletAddress: employee.walletAddress,
                    riskScore: screening.finalScore,
                    riskLevel: screening.riskLevel,
                    action: screening.action,
                    blocked: screening.action === RiskAction.BLOCK,
                    reason: screening.summary,
                    breakdown: screening.breakdown as any,
                    summary: screening.summary,
                    recommendations: screening.recommendations as any,
                    employeeId: employee.id,
                    employerId
                }
            });

            const employeeData = {
                ...employee,
                salaryAmount: Number(employee.salaryAmount),
                riskScore: screening.finalScore,
                riskLevel: screening.riskLevel,
                summary: screening.summary
            };

            if (screening.action === RiskAction.BLOCK) {
                blockedEmployees.push(employeeData);

                // Create CRITICAL alert
                await prisma.alert.create({
                    data: {
                        employerId,
                        severity: 'critical',
                        category: 'risk_screening',
                        title: `🔴 Payroll BLOCKED: ${employee.name}`,
                        message: `Employee ${employee.name} (${employee.walletAddress}) blocked due to high risk. ${screening.summary}`,
                        metadata: {
                            employeeId: employee.id,
                            employeeName: employee.name,
                            walletAddress: employee.walletAddress,
                            riskScore: screening.finalScore,
                            action: screening.action,
                            recommendations: screening.recommendations
                        }
                    }
                });
            } else if (screening.action === RiskAction.WARN) {
                riskyEmployees.push(employeeData);

                // Create WARNING alert
                await prisma.alert.create({
                    data: {
                        employerId,
                        severity: 'warning',
                        category: 'risk_screening',
                        title: `⚠️ Payroll Warning: ${employee.name}`,
                        message: `Employee ${employee.name} flagged as risky. ${screening.summary}`,
                        metadata: {
                            employeeId: employee.id,
                            employeeName: employee.name,
                            walletAddress: employee.walletAddress,
                            riskScore: screening.finalScore,
                            action: screening.action
                        }
                    }
                });
            } else {
                safeEmployees.push(employeeData);
            }
        }

        const result = {
            safe: blockedEmployees.length === 0,
            totalEmployees: employees.length,
            blockedEmployees,
            riskyEmployees,
            safeEmployees,
            blockedSalaryTotal: blockedEmployees.reduce((sum, emp) => sum + emp.salaryAmount, 0),
            message: blockedEmployees.length > 0
                ? `⛔ ${blockedEmployees.length} employee(s) blocked. Payroll cannot proceed for these addresses.`
                : riskyEmployees.length > 0
                    ? `⚠️ ${riskyEmployees.length} employee(s) flagged as risky. Review recommended.`
                    : `✅ All ${employees.length} employee(s) cleared for payroll.`
        };

        logger.info('Pre-payroll screening completed', {
            employerId,
            total: result.totalEmployees,
            blocked: blockedEmployees.length,
            risky: riskyEmployees.length,
            safe: safeEmployees.length
        });

        return result;
    } catch (error: any) {
        logger.error('Pre-payroll screening failed', { error: error.message, employerId });
        throw error;
    }
}

/**
 * Hook: Post-employee creation screening
 * Call this AFTER adding a new employee
 */
export async function postEmployeeCreationScreening(
    employeeId: string,
    employerId: string,
    walletAddress: string
) {
    try {
        logger.info('Screening new employee wallet', { employeeId, walletAddress });

        const screening = await riskScreeningService.screenWallet(walletAddress);

        // Save to database
        const { prisma } = await import('../server');
        await prisma.riskScreening.create({
            data: {
                walletAddress,
                riskScore: screening.finalScore,
                riskLevel: screening.riskLevel,
                action: screening.action,
                blocked: screening.action === RiskAction.BLOCK,
                reason: screening.summary,
                breakdown: screening.breakdown as any,
                summary: screening.summary,
                recommendations: screening.recommendations as any,
                employeeId,
                employerId
            }
        });

        // Create alert if risky
        if (screening.action === RiskAction.BLOCK || screening.action === RiskAction.WARN) {
            await prisma.alert.create({
                data: {
                    employerId,
                    severity: screening.action === RiskAction.BLOCK ? 'critical' : 'warning',
                    category: 'risk_screening',
                    title: `New Employee Risk Alert`,
                    message: `Newly added employee has ${screening.riskLevel} risk. ${screening.summary}`,
                    metadata: {
                        employeeId,
                        walletAddress,
                        riskScore: screening.finalScore,
                        action: screening.action
                    }
                }
            });
        }

        return {
            screening,
            shouldBlock: screening.action === RiskAction.BLOCK
        };
    } catch (error: any) {
        logger.error('Post-employee creation screening failed', {
            error: error.message,
            employeeId
        });
        throw error;
    }
}

/**
 * Scheduled job: Re-screen all employees periodically
 * Run this daily or weekly
 */
export async function scheduledEmployeeRescreening() {
    try {
        logger.info('Starting scheduled employee rescreening');

        const { prisma } = await import('../server');

        // Get all active employees
        const employees = await prisma.employee.findMany({
            where: { active: true },
            select: {
                id: true,
                employerId: true,
                name: true,
                walletAddress: true
            }
        });

        logger.info(`Rescreening ${employees.length} employees`);

        let flaggedCount = 0;

        for (const employee of employees) {
            try {
                // Force re-screen (skip cache)
                const screening = await riskScreeningService.screenWallet(
                    employee.walletAddress,
                    true // skipCache
                );

                // Save to database
                await prisma.riskScreening.create({
                    data: {
                        walletAddress: employee.walletAddress,
                        riskScore: screening.finalScore,
                        riskLevel: screening.riskLevel,
                        action: screening.action,
                        blocked: screening.action === RiskAction.BLOCK,
                        reason: screening.summary,
                        breakdown: screening.breakdown as any,
                        summary: screening.summary,
                        recommendations: screening.recommendations as any,
                        employeeId: employee.id,
                        employerId: employee.employerId
                    }
                });

                // Alert if newly flagged
                if (screening.action === RiskAction.BLOCK || screening.action === RiskAction.WARN) {
                    flaggedCount++;

                    await prisma.alert.create({
                        data: {
                            employerId: employee.employerId,
                            severity: screening.action === RiskAction.BLOCK ? 'critical' : 'warning',
                            category: 'risk_screening',
                            title: `Employee Risk Status Changed: ${employee.name}`,
                            message: `Employee ${employee.name} now has ${screening.riskLevel} risk. ${screening.summary}`,
                            metadata: {
                                employeeId: employee.id,
                                employeeName: employee.name,
                                walletAddress: employee.walletAddress,
                                riskScore: screening.finalScore,
                                action: screening.action
                            }
                        }
                    });
                }
            } catch (error: any) {
                logger.error('Failed to rescreen employee', {
                    employeeId: employee.id,
                    error: error.message
                });
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        logger.info('Scheduled rescreening completed', {
            total: employees.length,
            flagged: flaggedCount
        });

        return {
            success: true,
            totalScreened: employees.length,
            flaggedCount
        };
    } catch (error: any) {
        logger.error('Scheduled rescreening failed', { error: error.message });
        throw error;
    }
}