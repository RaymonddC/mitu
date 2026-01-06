export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum RiskAction {
    PROCEED = 'proceed',
    WARN = 'warn',
    BLOCK = 'block'
}

export interface WalletAgeAnalysis {
    ageInDays: number;
    firstTransactionDate: Date | null;
    riskScore: number;
    reason: string;
}

export interface TransactionHistoryAnalysis {
    totalTxCount: number;
    incomingTxCount: number;
    outgoingTxCount: number;
    uniqueInteractions: number;
    averageTxValue: number;
    suspiciousBurstActivity: boolean;
    riskScore: number;
    redFlags: string[];
}

export interface SanctionsCheckResult {
    isSanctioned: boolean;
    source: string | null;
    details: string | null;
    riskScore: number;
    reason: string;
}

export interface ContractInteractionAnalysis {
    totalContractInteractions: number;
    verifiedContracts: number;
    unverifiedContracts: number;
    hasRiskyInteractions: boolean;
    riskScore: number;
    warnings: string[];
}

export interface BalancePatternAnalysis {
    currentBalance: number;
    averageBalance: number;
    isZeroBalance: boolean;
    hasLargeFluctuations: boolean;
    riskScore: number;
    flags: string[];
}

export interface RiskBreakdown {
    walletAge: WalletAgeAnalysis;
    transactionHistory: TransactionHistoryAnalysis;
    sanctions: SanctionsCheckResult;
    contractInteractions: ContractInteractionAnalysis;
    balancePattern: BalancePatternAnalysis;
}

export interface RiskScreeningResult {
    address: string;
    finalScore: number;
    riskLevel: RiskLevel;
    action: RiskAction;
    breakdown: RiskBreakdown;
    summary: string;
    recommendations: string[];
    timestamp: Date;
    cached: boolean;
}

export interface EtherscanTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    contractAddress: string;
}

export interface EtherscanResponse {
    status: string;
    message: string;
    result: EtherscanTransaction[] | string;
}

export interface ContractInfo {
    address: string;
    isVerified: boolean;
    contractName: string;
    compilerVersion: string;
    optimization: boolean;
    hasAudit: boolean;
}

// Risk scoring weights
export const RISK_WEIGHTS = {
    walletAge: 0.15,        // 15%
    transactionHistory: 0.20, // 20%
    sanctions: 0.40,         // 40% - MOST CRITICAL
    contractInteractions: 0.15, // 15%
    balancePattern: 0.10    // 10%
} as const;

// Risk thresholds
export const RISK_THRESHOLDS = {
    LOW: 30,      // 0-30: Proceed
    MEDIUM: 50,   // 30-50: Monitor
    HIGH: 80,     // 50-80: Warn
    CRITICAL: 80  // 80-100: Block
} as const;

// Known bad actor lists
export const TORNADO_CASH_ADDRESSES = [
    '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc',
    '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936',
    '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf',
    '0xa160cdab225685da1d56aa342ad8841c3b53f291',
    '0xf60dd140cff0706bae9cd734ac3ae76ad9ebc32a',
    '0x22aaa7720ddd5388a3c0a3333430953c68f1849b',
    '0xba214c1c1928a32bffe790263e38b4af9bfcd659',
    '0xb1c8094b234dce6e03f10a5b673c1d8c69739a00',
    '0x527653ea119f3e6a1f5bd18fbf4714081d7b31ce',
    '0x58e8dcc13be9780fc42e8723d8ead4cf46943df2'
].map(addr => addr.toLowerCase());

export const KNOWN_SCAM_PATTERNS = {
    phishingSignatures: [
        'SecurityUpdate()',
        'ClaimReward()',
        'Verify()'
    ],
    // Common scam contract names
    scamNames: [
        'SecurityUpdate',
        'ClaimAirdrop',
        'VerifyWallet',
        'UpdateSecurity'
    ]
} as const;