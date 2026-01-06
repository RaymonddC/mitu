import NodeCache from 'node-cache';
import { logger } from '../middleware/logger';
import { blockchainAnalyzer } from './blockchainAnalyzer';
import { sanctionsChecker } from './sanctionsChecker';
import {
    RiskScreeningResult,
    RiskLevel,
    RiskAction,
    ContractInteractionAnalysis,
    RiskBreakdown,
    RISK_WEIGHTS,
    RISK_THRESHOLDS
} from '../types/risk.types';

export class RiskScreeningService {
    private cache: NodeCache;

    constructor() {
        // Cache screening results for 1 hour
        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
        logger.info('RiskScreeningService initialized');
    }

    /**
     * Perform complete risk screening on a wallet address
     */
    async screenWallet(address: string, skipCache = false): Promise<RiskScreeningResult> {
        // Validate address format
        if (!blockchainAnalyzer.isValidAddress(address)) {
            throw new Error(`Invalid Ethereum address: ${address}`);
        }

        const normalizedAddress = address.toLowerCase();
        const cacheKey = `risk_${normalizedAddress}`;

        // Check cache
        if (!skipCache) {
            const cached = this.cache.get<RiskScreeningResult>(cacheKey);
            if (cached) {
                logger.info('Using cached risk screening result', { address });
                return { ...cached, cached: true };
            }
        }

        logger.info('Starting risk screening', { address });
        const startTime = Date.now();

        try {
            // Run all checks in parallel
            const [
                walletAge,
                transactionHistory,
                sanctions,
                contractInteractions,
                balancePattern
            ] = await Promise.all([
                blockchainAnalyzer.analyzeWalletAge(address),
                blockchainAnalyzer.analyzeTransactionHistory(address),
                sanctionsChecker.checkSanctions(address),
                this.analyzeContractInteractions(address),
                blockchainAnalyzer.analyzeBalancePattern(address)
            ]);

            // Calculate weighted final risk score
            const finalScore = this.calculateFinalScore({
                walletAge,
                transactionHistory,
                sanctions,
                contractInteractions,
                balancePattern
            });

            // Determine risk level and action
            const riskLevel = this.determineRiskLevel(finalScore);
            const action = this.determineAction(finalScore, sanctions.isSanctioned);

            // Generate summary and recommendations
            const summary = this.generateSummary(finalScore, riskLevel, {
                walletAge,
                transactionHistory,
                sanctions,
                contractInteractions,
                balancePattern
            });

            const recommendations = this.generateRecommendations(riskLevel, {
                walletAge,
                transactionHistory,
                sanctions,
                contractInteractions,
                balancePattern
            });

            const result: RiskScreeningResult = {
                address: normalizedAddress,
                finalScore,
                riskLevel,
                action,
                breakdown: {
                    walletAge,
                    transactionHistory,
                    sanctions,
                    contractInteractions,
                    balancePattern
                },
                summary,
                recommendations,
                timestamp: new Date(),
                cached: false
            };

            // Cache the result
            this.cache.set(cacheKey, result);

            const duration = Date.now() - startTime;
            logger.info('Risk screening completed', {
                address,
                finalScore,
                riskLevel,
                action,
                duration: `${duration}ms`
            });

            return result;
        } catch (error: any) {
            logger.error('Risk screening failed', { error: error.message, address });
            throw new Error(`Risk screening failed: ${error.message}`);
        }
    }

    /**
     * Analyze contract interactions
     */
    private async analyzeContractInteractions(address: string): Promise<ContractInteractionAnalysis> {
        try {
            const transactions = await (blockchainAnalyzer as any).getTransactions(address);
            const normalizedAddress = address.toLowerCase();

            // Find contract interactions
            const contractInteractions = [];
            for (const tx of transactions) {
                const targetAddress = tx.from.toLowerCase() === normalizedAddress ? tx.to : tx.from;
                if (targetAddress && await blockchainAnalyzer.isContract(targetAddress)) {
                    contractInteractions.push(targetAddress);
                }
            }

            // Get contract info for unique contracts
            const uniqueContracts = [...new Set(contractInteractions)];
            const contractInfos = await Promise.all(
                uniqueContracts.slice(0, 20).map(addr => blockchainAnalyzer.getContractInfo(addr))
            );

            const verifiedCount = contractInfos.filter(info => info.isVerified).length;
            const unverifiedCount = contractInfos.length - verifiedCount;

            // Risk analysis
            const warnings: string[] = [];
            let riskScore = 0;

            if (unverifiedCount > 0) {
                riskScore += unverifiedCount * 5;
                warnings.push(`Interacted with ${unverifiedCount} unverified contract(s)`);
            }

            if (unverifiedCount > verifiedCount && contractInfos.length > 0) {
                riskScore += 15;
                warnings.push('Majority of contract interactions are with unverified contracts');
            }

            const hasRiskyInteractions = riskScore > 20;

            return {
                totalContractInteractions: uniqueContracts.length,
                verifiedContracts: verifiedCount,
                unverifiedContracts: unverifiedCount,
                hasRiskyInteractions,
                riskScore: Math.min(riskScore, 100),
                warnings
            };
        } catch (error: any) {
            logger.error('Contract interaction analysis failed', { error: error.message, address });
            return {
                totalContractInteractions: 0,
                verifiedContracts: 0,
                unverifiedContracts: 0,
                hasRiskyInteractions: false,
                riskScore: 10,
                warnings: ['Unable to analyze contract interactions']
            };
        }
    }

    /**
     * Calculate weighted final risk score
     */
    private calculateFinalScore(breakdown: RiskBreakdown): number {
        const score =
            breakdown.walletAge.riskScore * RISK_WEIGHTS.walletAge +
            breakdown.transactionHistory.riskScore * RISK_WEIGHTS.transactionHistory +
            breakdown.sanctions.riskScore * RISK_WEIGHTS.sanctions +
            breakdown.contractInteractions.riskScore * RISK_WEIGHTS.contractInteractions +
            breakdown.balancePattern.riskScore * RISK_WEIGHTS.balancePattern;

        return Math.round(Math.min(score, 100));
    }

    /**
     * Determine risk level based on score
     */
    private determineRiskLevel(score: number): RiskLevel {
        if (score >= RISK_THRESHOLDS.CRITICAL) return RiskLevel.CRITICAL;
        if (score >= RISK_THRESHOLDS.HIGH) return RiskLevel.HIGH;
        if (score >= RISK_THRESHOLDS.MEDIUM) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    /**
     * Determine action based on risk level and sanctions
     */
    private determineAction(score: number, isSanctioned: boolean): RiskAction {
        // Always block if sanctioned
        if (isSanctioned) return RiskAction.BLOCK;

        // Block if critical risk
        if (score >= RISK_THRESHOLDS.CRITICAL) return RiskAction.BLOCK;

        // Warn if high risk
        if (score >= RISK_THRESHOLDS.HIGH) return RiskAction.WARN;

        // Proceed otherwise
        return RiskAction.PROCEED;
    }

    /**
     * Generate human-readable summary
     */
    private generateSummary(score: number, level: RiskLevel, breakdown: RiskBreakdown): string {
        const { sanctions, walletAge, transactionHistory } = breakdown;

        // Critical - Sanctioned
        if (sanctions.isSanctioned) {
            return `🔴 CRITICAL RISK (Score: ${score}/100): ${sanctions.reason}. Transaction must be blocked.`;
        }

        // Critical - High score
        if (level === RiskLevel.CRITICAL) {
            const reasons = [];
            if (walletAge.riskScore > 20) reasons.push(walletAge.reason);
            if (transactionHistory.riskScore > 20) reasons.push(transactionHistory.redFlags[0]);
            return `🔴 CRITICAL RISK (Score: ${score}/100): ${reasons.join('. ')}. Recommend blocking transaction.`;
        }

        // High risk
        if (level === RiskLevel.HIGH) {
            return `🟠 HIGH RISK (Score: ${score}/100): Multiple risk factors detected. Manual review recommended before proceeding.`;
        }

        // Medium risk
        if (level === RiskLevel.MEDIUM) {
            return `🟡 MEDIUM RISK (Score: ${score}/100): Some concerns identified. Monitor this address closely.`;
        }

        // Low risk
        return `🟢 LOW RISK (Score: ${score}/100): Wallet appears legitimate with normal activity patterns.`;
    }

    /**
     * Generate actionable recommendations
     */
    private generateRecommendations(level: RiskLevel, breakdown: RiskBreakdown): string[] {
        const recommendations: string[] = [];

        // Sanctions
        if (breakdown.sanctions.isSanctioned) {
            recommendations.push('❌ BLOCK TRANSACTION: Sanctioned address detected');
            recommendations.push('Report to compliance team immediately');
            return recommendations;
        }

        // Critical level
        if (level === RiskLevel.CRITICAL) {
            recommendations.push('❌ BLOCK TRANSACTION: Risk too high to proceed');
            recommendations.push('Conduct thorough investigation before any payment');
            recommendations.push('Request additional verification from payee');
        }

        // High level
        if (level === RiskLevel.HIGH) {
            recommendations.push('⚠️ PROCEED WITH CAUTION: Manual approval required');
            if (breakdown.walletAge.ageInDays < 7) {
                recommendations.push('Consider waiting for wallet to mature (7+ days)');
            }
            if (breakdown.transactionHistory.totalTxCount < 10) {
                recommendations.push('Request proof of wallet ownership');
            }
            recommendations.push('Enable transaction monitoring');
        }

        // Medium level
        if (level === RiskLevel.MEDIUM) {
            recommendations.push('✓ Can proceed with standard monitoring');
            if (breakdown.transactionHistory.redFlags.length > 0) {
                recommendations.push(`Monitor for: ${breakdown.transactionHistory.redFlags[0]}`);
            }
            recommendations.push('Set up alerts for unusual activity');
        }

        // Low level
        if (level === RiskLevel.LOW) {
            recommendations.push('✓ Safe to proceed with standard payroll');
            recommendations.push('No additional verification required');
        }

        return recommendations;
    }

    /**
     * Batch screen multiple wallets
     */
    async batchScreenWallets(addresses: string[]): Promise<Map<string, RiskScreeningResult>> {
        logger.info('Starting batch risk screening', { count: addresses.length });

        const results = new Map<string, RiskScreeningResult>();

        // Process in batches to avoid overwhelming APIs
        const batchSize = 5;
        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(addr => this.screenWallet(addr).catch(err => {
                    logger.error('Batch screening failed for address', { address: addr, error: err.message });
                    return null;
                }))
            );

            batch.forEach((addr, index) => {
                if (batchResults[index]) {
                    results.set(addr.toLowerCase(), batchResults[index]!);
                }
            });

            // Rate limit delay
            if (i + batchSize < addresses.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        logger.info('Batch screening completed', {
            total: addresses.length,
            successful: results.size
        });

        return results;
    }

    /**
     * Clear cache for specific address or all
     */
    clearCache(address?: string): void {
        if (address) {
            const cacheKey = `risk_${address.toLowerCase()}`;
            this.cache.del(cacheKey);
            logger.info('Risk screening cache cleared for address', { address });
        } else {
            this.cache.flushAll();
            logger.info('All risk screening cache cleared');
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            keys: this.cache.keys().length,
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses,
            ksize: this.cache.getStats().ksize,
            vsize: this.cache.getStats().vsize
        };
    }
}

export const riskScreeningService = new RiskScreeningService();