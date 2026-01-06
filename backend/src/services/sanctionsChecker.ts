import axios from 'axios';
import NodeCache from 'node-cache';
import { logger } from '../middleware/logger';
import { SanctionsCheckResult, TORNADO_CASH_ADDRESSES } from '../types/risk.types';
import { blockchainAnalyzer } from './blockchainAnalyzer';

export class SanctionsChecker {
    private cache: NodeCache;
    private ofacList: Set<string>;
    private scamList: Set<string>;

    constructor() {
        // Cache sanctions checks for 24 hours (they don't change often)
        this.cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
        this.ofacList = new Set();
        this.scamList = new Set();

        this.initializeLists();
    }

    /**
     * Initialize sanctions lists
     */
    private async initializeLists() {
        try {
            // Load OFAC sanctioned addresses
            await this.loadOFACList();

            // Load known scam addresses
            await this.loadScamList();

            logger.info('Sanctions lists initialized', {
                ofacCount: this.ofacList.size,
                scamCount: this.scamList.size
            });
        } catch (error: any) {
            logger.error('Failed to initialize sanctions lists', { error: error.message });
        }
    }

    /**
     * Load OFAC sanctioned addresses
     * In production, this should fetch from official OFAC API or database
     */
    private async loadOFACList() {
        // Hardcoded known OFAC sanctioned Ethereum addresses
        // Source: https://home.treasury.gov/policy-issues/financial-sanctions/recent-actions/20221108
        const knownOFACAddresses = [
            '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c', // Lazarus Group
            '0x722122df12d4e14e13ac3b6895a86e84145b6967', // Lazarus Group
            '0xdd4c48c0b24039969fc16d1cdf626eab821d3384', // Lazarus Group
            '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b', // Lazarus Group
            '0xd96f2b1c14db8458374d9aca76e26319445881fb', // Lazarus Group
            '0x4736dcf1b7a3d580672cce6e7c65cd5cc9cfba9d', // Lazarus Group
            '0x9f4cda013e354b8fc285bf4b9a60460cee7f7ea9', // Tornado Cash
            '0x23773e65ed146a459791799d01336db287f25334', // Tornado Cash
            '0xd47438c816c9e7f2e2888e060936a499af9582b3', // Tornado Cash
            '0x330bdfade01ee9bf63c209ee33102dd334618e0a', // Tornado Cash
            '0x1e34a77868e19a6647b1f2f47b51ed72dede95dd', // Tornado Cash
            '0x242654336ca2205714071898f67e254eb49acdce', // Ronin Bridge Exploiter
            '0x098b716b8aaf21512996dc57eb0615e2383e2f96', // Ronin Bridge Exploiter
            '0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b', // North Korea (Blender.io)
        ].map(addr => addr.toLowerCase());

        knownOFACAddresses.forEach(addr => this.ofacList.add(addr));

        logger.info('OFAC list loaded', { count: this.ofacList.size });
    }

    /**
     * Load known scam addresses from public databases
     */
    private async loadScamList() {
        try {
            // In production, fetch from CryptoScamDB, Chainabuse, etc.
            // For now, using hardcoded known scam addresses
            const knownScams = [
                '0x0000000000000000000000000000000000000000', // Null address (common in scams)
                '0x000000000000000000000000000000000000dead', // Burn address
            ].map(addr => addr.toLowerCase());

            knownScams.forEach(addr => this.scamList.add(addr));

            logger.info('Scam list loaded', { count: this.scamList.size });
        } catch (error: any) {
            logger.warn('Failed to load scam list', { error: error.message });
        }
    }

    /**
     * Check if address is sanctioned
     */
    async checkSanctions(address: string): Promise<SanctionsCheckResult> {
        const normalizedAddress = address.toLowerCase();

        // Check cache first
        const cacheKey = `sanctions_${normalizedAddress}`;
        const cached = this.cache.get<SanctionsCheckResult>(cacheKey);
        if (cached) {
            logger.debug('Using cached sanctions check', { address });
            return cached;
        }

        try {
            // 1. Check OFAC Sanctions List
            if (this.ofacList.has(normalizedAddress)) {
                const result: SanctionsCheckResult = {
                    isSanctioned: true,
                    source: 'OFAC',
                    details: 'Address appears on OFAC Specially Designated Nationals (SDN) List',
                    riskScore: 100,
                    reason: 'CRITICAL: Address sanctioned by U.S. Office of Foreign Assets Control'
                };
                this.cache.set(cacheKey, result);
                logger.warn('OFAC sanctioned address detected', { address });
                return result;
            }

            // 2. Check Tornado Cash interactions
            const hasTornadoCashInteraction = await blockchainAnalyzer.hasInteractedWith(
                address,
                TORNADO_CASH_ADDRESSES
            );

            if (hasTornadoCashInteraction) {
                const result: SanctionsCheckResult = {
                    isSanctioned: true,
                    source: 'Tornado Cash',
                    details: 'Wallet has interacted with Tornado Cash mixer service',
                    riskScore: 90,
                    reason: 'HIGH RISK: Tornado Cash interaction detected (privacy mixer)'
                };
                this.cache.set(cacheKey, result);
                logger.warn('Tornado Cash interaction detected', { address });
                return result;
            }

            // 3. Check known scam addresses
            if (this.scamList.has(normalizedAddress)) {
                const result: SanctionsCheckResult = {
                    isSanctioned: true,
                    source: 'ScamDB',
                    details: 'Address flagged in scam database',
                    riskScore: 95,
                    reason: 'CRITICAL: Known scam address'
                };
                this.cache.set(cacheKey, result);
                logger.warn('Known scam address detected', { address });
                return result;
            }

            // 4. Check CryptoScamDB API (if available)
            const scamDbCheck = await this.checkCryptoScamDB(address);
            if (scamDbCheck.isSanctioned) {
                this.cache.set(cacheKey, scamDbCheck);
                return scamDbCheck;
            }

            // 5. Check for null/burn addresses (common in scams)
            if (this.isNullOrBurnAddress(address)) {
                const result: SanctionsCheckResult = {
                    isSanctioned: true,
                    source: 'System',
                    details: 'Null or burn address',
                    riskScore: 80,
                    reason: 'Suspicious: Null or burn address used'
                };
                this.cache.set(cacheKey, result);
                return result;
            }

            // Clean - no sanctions found
            const result: SanctionsCheckResult = {
                isSanctioned: false,
                source: null,
                details: null,
                riskScore: 0,
                reason: 'No sanctions found'
            };
            this.cache.set(cacheKey, result);
            return result;

        } catch (error: any) {
            logger.error('Sanctions check failed', { error: error.message, address });
            return {
                isSanctioned: false,
                source: null,
                details: null,
                riskScore: 10,
                reason: 'Unable to complete sanctions check'
            };
        }
    }

    /**
     * Check CryptoScamDB API
     */
    private async checkCryptoScamDB(address: string): Promise<SanctionsCheckResult> {
        try {
            // CryptoScamDB API (free tier available)
            const url = `https://api.cryptoscamdb.org/v1/check/${address}`;

            const response = await axios.get(url, {
                timeout: 5000,
                headers: { 'Accept': 'application/json' }
            });

            if (response.data?.success && response.data?.result?.status === 'scam') {
                logger.warn('CryptoScamDB match found', { address, type: response.data.result.type });
                return {
                    isSanctioned: true,
                    source: 'CryptoScamDB',
                    details: response.data.result.type || 'Flagged as scam',
                    riskScore: 95,
                    reason: `Scam detected: ${response.data.result.type || 'Unknown type'}`
                };
            }

            return {
                isSanctioned: false,
                source: null,
                details: null,
                riskScore: 0,
                reason: 'Clean'
            };
        } catch (error: any) {
            // API might be down or rate limited, not critical
            logger.debug('CryptoScamDB check skipped', { error: error.message });
            return {
                isSanctioned: false,
                source: null,
                details: null,
                riskScore: 0,
                reason: 'Clean'
            };
        }
    }

    /**
     * Check if address is null or burn address
     */
    private isNullOrBurnAddress(address: string): boolean {
        const normalizedAddress = address.toLowerCase();
        const nullAddresses = [
            '0x0000000000000000000000000000000000000000',
            '0x000000000000000000000000000000000000dead',
            '0x0000000000000000000000000000000000000001',
        ];
        return nullAddresses.includes(normalizedAddress);
    }

    /**
     * Batch check multiple addresses
     */
    async batchCheckSanctions(addresses: string[]): Promise<Map<string, SanctionsCheckResult>> {
        const results = new Map<string, SanctionsCheckResult>();

        // Check in batches to respect rate limits
        const batchSize = 5;
        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(addr => this.checkSanctions(addr))
            );

            batch.forEach((addr, index) => {
                results.set(addr.toLowerCase(), batchResults[index]);
            });

            // Rate limit delay (1 second between batches)
            if (i + batchSize < addresses.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Add address to custom blacklist
     */
    addToBlacklist(address: string, source: string = 'Custom'): void {
        const normalizedAddress = address.toLowerCase();
        this.scamList.add(normalizedAddress);
        logger.info('Address added to blacklist', { address, source });
    }

    /**
     * Remove address from custom blacklist
     */
    removeFromBlacklist(address: string): void {
        const normalizedAddress = address.toLowerCase();
        this.scamList.delete(normalizedAddress);
        logger.info('Address removed from blacklist', { address });
    }

    /**
     * Clear cache (useful for testing)
     */
    clearCache(): void {
        this.cache.flushAll();
        logger.info('Sanctions check cache cleared');
    }
}

export const sanctionsChecker = new SanctionsChecker();