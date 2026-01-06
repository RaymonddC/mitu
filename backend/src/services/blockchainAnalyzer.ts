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
}

export const blockchainAnalyzer = new BlockchainAnalyzer();