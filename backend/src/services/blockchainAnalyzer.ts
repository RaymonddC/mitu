import { ethers } from 'ethers';
import axios from 'axios';
import NodeCache from 'node-cache';
import { logger } from '../middleware/logger';
import {
    EtherscanResponse,
    EtherscanTransaction,
    WalletAgeAnalysis,
    TransactionHistoryAnalysis,
    BalancePatternAnalysis,
    ContractInfo
} from '../types/risk.types';

export class BlockchainAnalyzer {
    private provider: ethers.JsonRpcProvider;
    private etherscanApiKey: string;
    private etherscanBaseUrl: string;
    private cache: NodeCache;
    private chainId: number;

    constructor() {
        const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
        this.chainId = parseInt(process.env.ETHEREUM_CHAIN_ID || '11155111'); // Sepolia default

        // Sepolia testnet
        this.etherscanBaseUrl = this.chainId === 11155111
            ? 'https://api-sepolia.etherscan.io/api'
            : 'https://api.etherscan.io/api';

        // Cache for 1 hour
        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

        logger.info('BlockchainAnalyzer initialized', {
            network: this.chainId === 11155111 ? 'Sepolia' : 'Mainnet',
            cacheEnabled: true
        });
    }

    /**
     * Get transaction list from Etherscan
     */
    private async getTransactions(address: string): Promise<EtherscanTransaction[]> {
        const cacheKey = `tx_${address}`;
        const cached = this.cache.get<EtherscanTransaction[]>(cacheKey);

        if (cached) {
            logger.debug('Using cached transactions', { address });
            return cached;
        }

        try {
            const url = `${this.etherscanBaseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${this.etherscanApiKey}`;

            const response = await axios.get<EtherscanResponse>(url);

            if (response.data.status !== '1') {
                logger.warn('Etherscan API error', {
                    address,
                    message: response.data.message
                });
                return [];
            }

            const transactions = Array.isArray(response.data.result)
                ? response.data.result
                : [];

            this.cache.set(cacheKey, transactions);

            logger.debug('Fetched transactions from Etherscan', {
                address,
                count: transactions.length
            });

            return transactions;
        } catch (error: any) {
            logger.error('Failed to fetch transactions', {
                error: error.message,
                address
            });
            return [];
        }
    }

    /**
     * Analyze wallet age and first transaction
     */
    async analyzeWalletAge(address: string): Promise<WalletAgeAnalysis> {
        try {
            const transactions = await this.getTransactions(address);

            if (transactions.length === 0) {
                return {
                    ageInDays: 0,
                    firstTransactionDate: null,
                    riskScore: 30,
                    reason: 'No transaction history - new or unused wallet'
                };
            }

            const firstTx = transactions[0];
            const firstTxDate = new Date(parseInt(firstTx.timeStamp) * 1000);
            const now = Date.now();
            const ageInMs = now - firstTxDate.getTime();
            const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

            // Risk scoring based on age
            let riskScore = 0;
            let reason = '';

            if (ageInDays < 1) {
                riskScore = 30;
                reason = `Wallet created less than 1 day ago (${ageInDays.toFixed(1)} days)`;
            } else if (ageInDays < 7) {
                riskScore = 20;
                reason = `Wallet less than 1 week old (${ageInDays.toFixed(1)} days)`;
            } else if (ageInDays < 30) {
                riskScore = 10;
                reason = `Wallet less than 1 month old (${ageInDays.toFixed(1)} days)`;
            } else if (ageInDays < 90) {
                riskScore = 5;
                reason = `Wallet less than 3 months old (${ageInDays.toFixed(0)} days)`;
            } else {
                riskScore = 0;
                reason = `Established wallet (${ageInDays.toFixed(0)} days old)`;
            }

            return {
                ageInDays: Math.floor(ageInDays),
                firstTransactionDate: firstTxDate,
                riskScore,
                reason
            };
        } catch (error: any) {
            logger.error('Wallet age analysis failed', { error: error.message, address });
            return {
                ageInDays: 0,
                firstTransactionDate: null,
                riskScore: 20,
                reason: 'Unable to analyze wallet age'
            };
        }
    }

    /**
     * Analyze transaction history patterns
     */
    async analyzeTransactionHistory(address: string): Promise<TransactionHistoryAnalysis> {
        try {
            const transactions = await this.getTransactions(address);
            const normalizedAddress = address.toLowerCase();

            const incomingTxs = transactions.filter(
                tx => tx.to.toLowerCase() === normalizedAddress
            );
            const outgoingTxs = transactions.filter(
                tx => tx.from.toLowerCase() === normalizedAddress
            );

            // Calculate unique interactions
            const uniqueAddresses = new Set<string>();
            transactions.forEach(tx => {
                const other = tx.from.toLowerCase() === normalizedAddress ? tx.to : tx.from;
                uniqueAddresses.add(other.toLowerCase());
            });

            // Calculate average transaction value
            const totalValue = transactions.reduce((sum, tx) => {
                return sum + parseFloat(ethers.formatEther(tx.value));
            }, 0);
            const averageTxValue = transactions.length > 0 ? totalValue / transactions.length : 0;

            // Check for suspicious burst activity (100+ tx in 1 hour)
            const oneHourAgo = Date.now() / 1000 - 3600;
            const recentTxs = transactions.filter(
                tx => parseInt(tx.timeStamp) > oneHourAgo
            );
            const suspiciousBurstActivity = recentTxs.length > 100;

            // Risk analysis
            const redFlags: string[] = [];
            let riskScore = 0;

            // Very few transactions
            if (transactions.length < 5) {
                riskScore += 25;
                redFlags.push(`Only ${transactions.length} transactions - minimal activity`);
            } else if (transactions.length < 10) {
                riskScore += 15;
                redFlags.push(`Low transaction count (${transactions.length})`);
            }

            // Only receiving, never sending (money mule pattern)
            if (incomingTxs.length > 0 && outgoingTxs.length === 0) {
                riskScore += 30;
                redFlags.push('Only receives funds, never sends - possible drop wallet');
            }

            // Burst activity
            if (suspiciousBurstActivity) {
                riskScore += 25;
                redFlags.push(`Suspicious burst activity: ${recentTxs.length} tx in last hour`);
            }

            // Very few unique interactions
            if (uniqueAddresses.size < 3 && transactions.length > 5) {
                riskScore += 15;
                redFlags.push('Limited unique interactions - possible automated bot');
            }

            return {
                totalTxCount: transactions.length,
                incomingTxCount: incomingTxs.length,
                outgoingTxCount: outgoingTxs.length,
                uniqueInteractions: uniqueAddresses.size,
                averageTxValue,
                suspiciousBurstActivity,
                riskScore: Math.min(riskScore, 100),
                redFlags
            };
        } catch (error: any) {
            logger.error('Transaction history analysis failed', {
                error: error.message,
                address
            });
            return {
                totalTxCount: 0,
                incomingTxCount: 0,
                outgoingTxCount: 0,
                uniqueInteractions: 0,
                averageTxValue: 0,
                suspiciousBurstActivity: false,
                riskScore: 20,
                redFlags: ['Unable to analyze transaction history']
            };
        }
    }

    /**
     * Analyze balance patterns
     */
    async analyzeBalancePattern(address: string): Promise<BalancePatternAnalysis> {
        try {
            // Get current balance
            const balance = await this.provider.getBalance(address);
            const currentBalance = parseFloat(ethers.formatEther(balance));

            // Get transaction history
            const transactions = await this.getTransactions(address);
            const normalizedAddress = address.toLowerCase();

            // Calculate historical average balance (simplified)
            let runningBalance = 0;
            const balanceSnapshots: number[] = [];

            transactions.forEach(tx => {
                const value = parseFloat(ethers.formatEther(tx.value));
                if (tx.from.toLowerCase() === normalizedAddress) {
                    runningBalance -= value; // Sent
                } else {
                    runningBalance += value; // Received
                }
                balanceSnapshots.push(Math.abs(runningBalance));
            });

            const averageBalance = balanceSnapshots.length > 0
                ? balanceSnapshots.reduce((a, b) => a + b, 0) / balanceSnapshots.length
                : 0;

            // Check for large fluctuations
            const maxBalance = Math.max(...balanceSnapshots, currentBalance);
            const hasLargeFluctuations = maxBalance > (averageBalance * 100) && averageBalance > 0;

            // Risk analysis
            const flags: string[] = [];
            let riskScore = 0;

            // Zero balance (dust/burner wallet)
            if (currentBalance === 0 && transactions.length > 0) {
                riskScore += 15;
                flags.push('Zero balance - possible burner wallet');
            }

            // Large balance with minimal activity
            if (currentBalance > 1 && transactions.length < 5) {
                riskScore += 20;
                flags.push(`Large balance (${currentBalance.toFixed(2)} ETH) with minimal activity`);
            }

            // Extreme fluctuations
            if (hasLargeFluctuations) {
                riskScore += 25;
                flags.push('Extreme balance fluctuations detected');
            }

            return {
                currentBalance,
                averageBalance,
                isZeroBalance: currentBalance === 0,
                hasLargeFluctuations,
                riskScore: Math.min(riskScore, 100),
                flags
            };
        } catch (error: any) {
            logger.error('Balance pattern analysis failed', {
                error: error.message,
                address
            });
            return {
                currentBalance: 0,
                averageBalance: 0,
                isZeroBalance: true,
                hasLargeFluctuations: false,
                riskScore: 10,
                flags: ['Unable to analyze balance pattern']
            };
        }
    }

    /**
     * Check if address is a contract
     */
    async isContract(address: string): Promise<boolean> {
        try {
            const code = await this.provider.getCode(address);
            return code !== '0x';
        } catch (error) {
            return false;
        }
    }

    /**
     * Get contract info from Etherscan
     */
    async getContractInfo(address: string): Promise<ContractInfo> {
        try {
            const url = `${this.etherscanBaseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`;

            const response = await axios.get<EtherscanResponse>(url);

            if (response.data.status !== '1' || !Array.isArray(response.data.result)) {
                return {
                    address,
                    isVerified: false,
                    contractName: 'Unknown',
                    compilerVersion: '',
                    optimization: false,
                    hasAudit: false
                };
            }

            const contractData = response.data.result[0] as any;

            return {
                address,
                isVerified: contractData.SourceCode !== '',
                contractName: contractData.ContractName || 'Unknown',
                compilerVersion: contractData.CompilerVersion || '',
                optimization: contractData.OptimizationUsed === '1',
                hasAudit: false // Would need external audit database
            };
        } catch (error: any) {
            logger.error('Failed to get contract info', { error: error.message, address });
            return {
                address,
                isVerified: false,
                contractName: 'Unknown',
                compilerVersion: '',
                optimization: false,
                hasAudit: false
            };
        }
    }

    /**
     * Check if wallet has interacted with specific addresses
     */
    async hasInteractedWith(walletAddress: string, targetAddresses: string[]): Promise<boolean> {
        try {
            const transactions = await this.getTransactions(walletAddress);
            const normalizedTargets = targetAddresses.map(addr => addr.toLowerCase());

            return transactions.some(tx => {
                const to = tx.to.toLowerCase();
                const from = tx.from.toLowerCase();
                return normalizedTargets.includes(to) || normalizedTargets.includes(from);
            });
        } catch (error) {
            return false;
        }
    }

    isValidAddress(address: string): boolean {
        return ethers.isAddress(address);
    }

    /**
     * ENHANCED: Analyze ERC-20 token transfers using Etherscan
     * Detects suspicious token activity and patterns
     */
    async analyzeTokenTransfers(address: string): Promise<{
        totalTokenTransfers: number;
        uniqueTokens: number;
        suspiciousTokens: number;
        riskScore: number;
        flags: string[];
    }> {
        try {
            const url = `${this.etherscanBaseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${this.etherscanApiKey}`;

            const response = await axios.get<EtherscanResponse>(url);

            if (response.data.status !== '1') {
                logger.warn('Etherscan token transfer API error', {
                    address,
                    message: response.data.message
                });
                return {
                    totalTokenTransfers: 0,
                    uniqueTokens: 0,
                    suspiciousTokens: 0,
                    riskScore: 0,
                    flags: ['Unable to analyze token transfers']
                };
            }

            const tokenTxs = Array.isArray(response.data.result) ? response.data.result : [];

            // Analyze unique tokens
            const uniqueTokens = new Set(tokenTxs.map((tx: any) => tx.contractAddress.toLowerCase()));

            // Check for known scam tokens (very high decimal counts, suspicious names)
            const suspiciousTokens = tokenTxs.filter((tx: any) => {
                const tokenName = (tx.tokenName || '').toLowerCase();
                const tokenSymbol = (tx.tokenSymbol || '').toLowerCase();
                const decimals = parseInt(tx.tokenDecimal || '18');

                // Red flags
                const hasScamKeywords = ['free', 'claim', 'airdrop', 'reward', 'bonus'].some(
                    keyword => tokenName.includes(keyword) || tokenSymbol.includes(keyword)
                );
                const unusualDecimals = decimals > 18 || decimals === 0;

                return hasScamKeywords || unusualDecimals;
            });

            const flags: string[] = [];
            let riskScore = 0;

            if (suspiciousTokens.length > 0) {
                riskScore += suspiciousTokens.length * 10;
                flags.push(`Received ${suspiciousTokens.length} suspicious token(s) - possible airdrop scam`);
            }

            if (uniqueTokens.size > 50) {
                riskScore += 15;
                flags.push(`Interacted with ${uniqueTokens.size} different tokens - possible bot`);
            }

            return {
                totalTokenTransfers: tokenTxs.length,
                uniqueTokens: uniqueTokens.size,
                suspiciousTokens: suspiciousTokens.length,
                riskScore: Math.min(riskScore, 100),
                flags
            };
        } catch (error: any) {
            logger.error('Token transfer analysis failed', { error: error.message, address });
            return {
                totalTokenTransfers: 0,
                uniqueTokens: 0,
                suspiciousTokens: 0,
                riskScore: 0,
                flags: []
            };
        }
    }

    /**
     * ENHANCED: Analyze internal transactions (contract calls) using Etherscan
     * Detects complex smart contract interactions
     */
    async analyzeInternalTransactions(address: string): Promise<{
        totalInternalTxs: number;
        contractCreations: number;
        failedTxs: number;
        riskScore: number;
        warnings: string[];
    }> {
        try {
            const url = `${this.etherscanBaseUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${this.etherscanApiKey}`;

            const response = await axios.get<EtherscanResponse>(url);

            if (response.data.status !== '1') {
                return {
                    totalInternalTxs: 0,
                    contractCreations: 0,
                    failedTxs: 0,
                    riskScore: 0,
                    warnings: []
                };
            }

            const internalTxs = Array.isArray(response.data.result) ? response.data.result : [];

            const contractCreations = internalTxs.filter((tx: any) => tx.type === 'create');
            const failedTxs = internalTxs.filter((tx: any) => tx.isError === '1');

            const warnings: string[] = [];
            let riskScore = 0;

            // High contract creation activity (possible deployer/attacker)
            if (contractCreations.length > 5) {
                riskScore += 25;
                warnings.push(`Created ${contractCreations.length} contracts - possible malicious deployer`);
            }

            // High failed transaction rate
            const failRate = internalTxs.length > 0 ? failedTxs.length / internalTxs.length : 0;
            if (failRate > 0.3 && internalTxs.length > 10) {
                riskScore += 20;
                warnings.push(`${(failRate * 100).toFixed(0)}% failed transactions - suspicious activity`);
            }

            return {
                totalInternalTxs: internalTxs.length,
                contractCreations: contractCreations.length,
                failedTxs: failedTxs.length,
                riskScore: Math.min(riskScore, 100),
                warnings
            };
        } catch (error: any) {
            logger.error('Internal transaction analysis failed', { error: error.message, address });
            return {
                totalInternalTxs: 0,
                contractCreations: 0,
                failedTxs: 0,
                riskScore: 0,
                warnings: []
            };
        }
    }

    /**
     * ENHANCED: Analyze gas usage patterns using Infura
     * Detects bot activity and unusual spending patterns
     */
    async analyzeGasPatterns(address: string): Promise<{
        averageGasPrice: number;
        totalGasSpent: number;
        highPriorityTxCount: number;
        riskScore: number;
        insights: string[];
    }> {
        try {
            const transactions = await this.getTransactions(address);
            const normalizedAddress = address.toLowerCase();

            // Only analyze outgoing transactions (where this wallet paid gas)
            const outgoingTxs = transactions.filter(
                tx => tx.from.toLowerCase() === normalizedAddress
            );

            if (outgoingTxs.length === 0) {
                return {
                    averageGasPrice: 0,
                    totalGasSpent: 0,
                    highPriorityTxCount: 0,
                    riskScore: 0,
                    insights: ['No outgoing transactions to analyze']
                };
            }

            // Calculate gas metrics
            let totalGasSpent = 0;
            let totalGasPrice = 0;
            let highPriorityCount = 0;

            for (const tx of outgoingTxs) {
                const gasUsed = parseInt(tx.gas);
                const gasPrice = parseFloat(ethers.formatUnits(tx.gasPrice, 'gwei'));
                const gasCost = gasUsed * parseFloat(tx.gasPrice);

                totalGasSpent += gasCost;
                totalGasPrice += gasPrice;

                // High priority if gas price > 100 gwei
                if (gasPrice > 100) {
                    highPriorityCount++;
                }
            }

            const averageGasPrice = totalGasPrice / outgoingTxs.length;
            const totalGasSpentEth = parseFloat(ethers.formatEther(totalGasSpent.toString()));

            const insights: string[] = [];
            let riskScore = 0;

            // Suspiciously low gas spending (possible subsidized bot)
            if (totalGasSpentEth < 0.001 && outgoingTxs.length > 20) {
                riskScore += 20;
                insights.push('Extremely low gas spending despite high activity - possible subsidized bot');
            }

            // High priority transactions (MEV bot or frontrunning)
            const highPriorityRate = highPriorityCount / outgoingTxs.length;
            if (highPriorityRate > 0.5 && outgoingTxs.length > 10) {
                riskScore += 25;
                insights.push(`${(highPriorityRate * 100).toFixed(0)}% high-priority transactions - possible MEV/frontrunning bot`);
            }

            // Consistent gas prices (bot behavior)
            const gasPriceVariance = this.calculateVariance(
                outgoingTxs.map(tx => parseFloat(ethers.formatUnits(tx.gasPrice, 'gwei')))
            );
            if (gasPriceVariance < 5 && outgoingTxs.length > 20) {
                riskScore += 15;
                insights.push('Highly consistent gas prices - possible automated bot');
            }

            return {
                averageGasPrice,
                totalGasSpent: totalGasSpentEth,
                highPriorityTxCount: highPriorityCount,
                riskScore: Math.min(riskScore, 100),
                insights
            };
        } catch (error: any) {
            logger.error('Gas pattern analysis failed', { error: error.message, address });
            return {
                averageGasPrice: 0,
                totalGasSpent: 0,
                highPriorityTxCount: 0,
                riskScore: 0,
                insights: []
            };
        }
    }

    /**
     * ENHANCED: Analyze transaction timing patterns using Infura
     * Detects automated bots and suspicious timing
     */
    async analyzeTimingPatterns(address: string): Promise<{
        averageTimeBetweenTxs: number;
        suspiciousTimingCount: number;
        nighttimeActivityRate: number;
        riskScore: number;
        patterns: string[];
    }> {
        try {
            const transactions = await this.getTransactions(address);
            const normalizedAddress = address.toLowerCase();

            const outgoingTxs = transactions
                .filter(tx => tx.from.toLowerCase() === normalizedAddress)
                .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

            if (outgoingTxs.length < 5) {
                return {
                    averageTimeBetweenTxs: 0,
                    suspiciousTimingCount: 0,
                    nighttimeActivityRate: 0,
                    riskScore: 0,
                    patterns: ['Insufficient data for timing analysis']
                };
            }

            // Calculate time differences
            const timeDiffs: number[] = [];
            let suspiciousTimingCount = 0;
            let nighttimeCount = 0;

            for (let i = 1; i < outgoingTxs.length; i++) {
                const timeDiff = parseInt(outgoingTxs[i].timeStamp) - parseInt(outgoingTxs[i - 1].timeStamp);
                timeDiffs.push(timeDiff);

                // Suspiciously regular intervals (within 10 seconds, repeated)
                if (timeDiff > 0 && timeDiff < 10) {
                    suspiciousTimingCount++;
                }

                // Check if transaction was during nighttime (UTC 2am-6am)
                const txDate = new Date(parseInt(outgoingTxs[i].timeStamp) * 1000);
                const hour = txDate.getUTCHours();
                if (hour >= 2 && hour <= 6) {
                    nighttimeCount++;
                }
            }

            const averageTimeBetweenTxs = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
            const nighttimeActivityRate = nighttimeCount / outgoingTxs.length;

            const patterns: string[] = [];
            let riskScore = 0;

            // Very regular timing (bot behavior)
            const timingVariance = this.calculateVariance(timeDiffs);
            if (timingVariance < 100 && outgoingTxs.length > 20) {
                riskScore += 25;
                patterns.push('Extremely regular transaction timing - likely automated bot');
            }

            // Burst of transactions with suspicious timing
            if (suspiciousTimingCount > 10) {
                riskScore += 20;
                patterns.push(`${suspiciousTimingCount} transactions within 10 seconds of each other - bot activity`);
            }

            // High nighttime activity (bots don't sleep)
            if (nighttimeActivityRate > 0.4 && outgoingTxs.length > 20) {
                riskScore += 15;
                patterns.push(`${(nighttimeActivityRate * 100).toFixed(0)}% activity during 2-6am UTC - possible bot`);
            }

            // Very fast average (< 1 minute between transactions)
            if (averageTimeBetweenTxs < 60 && outgoingTxs.length > 10) {
                riskScore += 20;
                patterns.push('Average time between transactions < 1 minute - automated activity');
            }

            return {
                averageTimeBetweenTxs,
                suspiciousTimingCount,
                nighttimeActivityRate,
                riskScore: Math.min(riskScore, 100),
                patterns
            };
        } catch (error: any) {
            logger.error('Timing pattern analysis failed', { error: error.message, address });
            return {
                averageTimeBetweenTxs: 0,
                suspiciousTimingCount: 0,
                nighttimeActivityRate: 0,
                riskScore: 0,
                patterns: []
            };
        }
    }

    /**
     * ENHANCED: Analyze wallet funding sources using Infura
     * Detects mixer usage and suspicious funding
     */
    async analyzeFundingSources(address: string): Promise<{
        totalFundingAddresses: number;
        exchangeDepositCount: number;
        mixerInteractionCount: number;
        riskScore: number;
        sources: string[];
    }> {
        try {
            const transactions = await this.getTransactions(address);
            const normalizedAddress = address.toLowerCase();

            // Get all incoming transactions
            const incomingTxs = transactions.filter(
                tx => tx.to.toLowerCase() === normalizedAddress && parseFloat(tx.value) > 0
            );

            if (incomingTxs.length === 0) {
                return {
                    totalFundingAddresses: 0,
                    exchangeDepositCount: 0,
                    mixerInteractionCount: 0,
                    riskScore: 0,
                    sources: ['No incoming transactions']
                };
            }

            // Analyze funding sources
            const fundingSources = new Set(incomingTxs.map(tx => tx.from.toLowerCase()));

            // Known exchange deposit addresses (simplified - would use external API in production)
            const knownExchangePatterns = ['0x0000000', '0x1111111']; // Placeholder
            const exchangeDepositCount = incomingTxs.filter(tx =>
                knownExchangePatterns.some(pattern => tx.from.includes(pattern))
            ).length;

            // Check for mixer interactions (Tornado Cash already in sanctions)
            const mixerInteractionCount = await this.checkMixerInteractions(address);

            const sources: string[] = [];
            let riskScore = 0;

            // Single funding source (possible controlled wallet)
            if (fundingSources.size === 1 && incomingTxs.length > 5) {
                riskScore += 20;
                sources.push('All funds from single source - possible controlled wallet');
            }

            // Mixer interactions
            if (mixerInteractionCount > 0) {
                riskScore += 40;
                sources.push(`Interacted with ${mixerInteractionCount} mixing service(s) - attempting to hide source`);
            }

            // Many small deposits (structuring/smurfing pattern)
            const smallDepositCount = incomingTxs.filter(tx => {
                const value = parseFloat(ethers.formatEther(tx.value));
                return value < 0.1;
            }).length;

            if (smallDepositCount > 20 && smallDepositCount / incomingTxs.length > 0.7) {
                riskScore += 25;
                sources.push('Many small deposits - possible structuring to avoid detection');
            }

            return {
                totalFundingAddresses: fundingSources.size,
                exchangeDepositCount,
                mixerInteractionCount,
                riskScore: Math.min(riskScore, 100),
                sources
            };
        } catch (error: any) {
            logger.error('Funding source analysis failed', { error: error.message, address });
            return {
                totalFundingAddresses: 0,
                exchangeDepositCount: 0,
                mixerInteractionCount: 0,
                riskScore: 0,
                sources: []
            };
        }
    }

    /**
     * Helper: Check for mixer interactions
     */
    private async checkMixerInteractions(address: string): Promise<number> {
        try {
            const transactions = await this.getTransactions(address);

            // Known mixer addresses (add more as needed)
            const mixerAddresses = [
                ...Array.from({ length: 10 }, (_, i) => `0x${i}`.toLowerCase()), // Placeholder
                // Would include comprehensive list in production
            ];

            const mixerInteractions = transactions.filter(tx =>
                mixerAddresses.includes(tx.to.toLowerCase()) ||
                mixerAddresses.includes(tx.from.toLowerCase())
            );

            return mixerInteractions.length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Helper: Calculate variance for pattern detection
     */
    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

        return Math.sqrt(variance); // Return standard deviation
    }
}

export const blockchainAnalyzer = new BlockchainAnalyzer();