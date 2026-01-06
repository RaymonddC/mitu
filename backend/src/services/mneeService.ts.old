/**
 * MNEE Service
 * Handles interactions with MNEE Network using the official MNEE SDK
 *
 * This service integrates with MNEE's TypeScript SDK for balance checking,
 * transfers, and transaction status tracking.
 */

import { logger } from '../middleware/logger';
import crypto from 'crypto';
import Mnee from '@mnee/ts-sdk';

export class MNEEService {
  private mnee: any;
  private environment: string;
  private apiKey: string;
  private useMockMode: boolean;

  constructor() {
    this.apiKey = process.env.MNEE_API_KEY || '';
    this.environment = process.env.MNEE_ENVIRONMENT || 'sandbox';

    // Use mock mode if API key is not configured or in test environment
    this.useMockMode = process.env.NODE_ENV === 'test' || !this.apiKey || this.apiKey === 'your-mnee-api-key-here';

    if (this.useMockMode) {
      logger.warn('MNEE SDK running in MOCK MODE - set MNEE_API_KEY to use real blockchain');
    } else {
      // Initialize real MNEE SDK
      this.mnee = new Mnee({
        environment: this.environment as 'sandbox' | 'production',
        apiKey: this.apiKey
      });
      logger.info(`MNEE SDK initialized in ${this.environment} mode`);
    }
  }

  /**
   * Get wallet balance
   * @param walletAddress - Bitcoin address for MNEE balance
   * @returns Balance in MNEE tokens (decimal format)
   */
  async getBalance(walletAddress: string): Promise<number> {
    try {
      logger.info(`Checking balance for ${walletAddress}`);

      // Mock mode for testing
      if (this.useMockMode) {
        logger.debug('Mock mode: returning test balance');
        return 100000; // Mock balance for testing
      }

      // Real MNEE SDK call
      const balance = await this.mnee.balance(walletAddress);
      logger.info(`Balance retrieved: ${balance.decimalAmount} MNEE`, {
        address: walletAddress,
        atomicAmount: balance.amount,
        decimalAmount: balance.decimalAmount
      });

      return balance.decimalAmount;

    } catch (error: any) {
      logger.error('Failed to get balance', { error: error.message, walletAddress });
      throw new Error(`Failed to check balance: ${error.message}`);
    }
  }

  /**
   * Execute salary transfer using MNEE SDK
   * @param fromWallet - Employer wallet address (not used directly, WIF key used instead)
   * @param toWallet - Employee Bitcoin address
   * @param amount - Salary amount in MNEE
   * @returns Transaction hash (or ticketId in async mode)
   */
  async executeSalaryTransfer(
    fromWallet: string,
    toWallet: string,
    amount: number
  ): Promise<string> {
    try {
      logger.info('Executing salary transfer', { fromWallet, toWallet, amount });

      // Validate inputs
      if (!toWallet) {
        throw new Error('Invalid employee wallet address');
      }

      if (amount <= 0) {
        throw new Error('Invalid amount - must be greater than 0');
      }

      // Mock mode for testing
      if (this.useMockMode) {
        const mockTxHash = `mnee_tx_${crypto.randomBytes(32).toString('hex')}`;
        logger.info('Mock transfer executed', { txHash: mockTxHash });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        return mockTxHash;
      }

      // Real MNEE SDK transfer
      const employerWif = process.env.EMPLOYER_PRIVATE_KEY;
      if (!employerWif) {
        throw new Error('EMPLOYER_PRIVATE_KEY not configured in environment');
      }

      const recipients = [
        {
          address: toWallet,
          amount: amount
        }
      ];

      logger.info('Initiating MNEE transfer', { recipients });
      const response = await this.mnee.transfer(recipients, employerWif);

      if (response.ticketId) {
        logger.info('Transfer submitted successfully', { ticketId: response.ticketId });

        // Poll for transaction status to get the actual tx hash
        const status = await this.waitForTransactionStatus(response.ticketId);

        if (status.status === 'SUCCESS' || status.status === 'MINED') {
          logger.info('Transfer confirmed', {
            ticketId: response.ticketId,
            txId: status.tx_id,
            status: status.status
          });
          return status.tx_id;
        } else if (status.status === 'FAILED') {
          throw new Error(`Transfer failed: ${status.errors || 'Unknown error'}`);
        } else {
          // Return ticketId if still broadcasting
          logger.warn('Transfer still broadcasting', { ticketId: response.ticketId });
          return response.ticketId;
        }
      } else {
        throw new Error('Transfer failed - no ticket ID returned');
      }

    } catch (error: any) {
      logger.error('Failed to execute salary transfer', {
        error: error.message,
        fromWallet,
        toWallet,
        amount
      });
      throw new Error(`Salary transfer failed: ${error.message}`);
    }
  }

  /**
   * Wait for transaction status with polling
   * @param ticketId - Transaction ticket ID
   * @param maxAttempts - Maximum polling attempts (default: 30)
   * @returns Transaction status
   */
  private async waitForTransactionStatus(ticketId: string, maxAttempts: number = 30): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.mnee.getTxStatus(ticketId);

        if (['SUCCESS', 'MINED', 'FAILED'].includes(status.status)) {
          return status;
        }

        logger.debug(`Waiting for transaction... Status: ${status.status}`, { ticketId, attempt: attempts + 1 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;

      } catch (error: any) {
        logger.error('Error checking transaction status', { error: error.message, ticketId });
        throw error;
      }
    }

    throw new Error(`Transaction timeout after ${maxAttempts} attempts`);
  }

  /**
   * Check if wallet address is valid Bitcoin address
   * @param walletAddress - Wallet address to validate
   * @returns true if valid
   */
  async validateWalletAddress(walletAddress: string): Promise<boolean> {
    try {
      // Basic validation
      if (!walletAddress || typeof walletAddress !== 'string') {
        return false;
      }

      // Remove whitespace
      const trimmed = walletAddress.trim();

      // Bitcoin address validation (basic)
      // Valid Bitcoin addresses:
      // - Legacy (P2PKH): start with '1', 26-35 characters
      // - P2SH: start with '3', 26-35 characters
      // - Bech32 (SegWit): start with 'bc1', lowercase, 42-62 characters
      // - Testnet: start with 'm', 'n', or '2'

      if (trimmed.length < 26 || trimmed.length > 62) {
        return false;
      }

      // Check valid prefixes
      const validPrefixes = ['1', '3', 'bc1', 'm', 'n', '2'];
      const hasValidPrefix = validPrefixes.some(prefix => trimmed.startsWith(prefix));

      if (!hasValidPrefix) {
        // For backward compatibility with mock mode, also accept 'mnee' prefix
        return this.useMockMode && trimmed.startsWith('mnee');
      }

      // Check valid characters (Base58 for legacy, bech32 for SegWit)
      if (trimmed.startsWith('bc1')) {
        // Bech32 validation (lowercase alphanumeric, no '1', 'b', 'i', 'o')
        return /^bc1[a-z0-9]{39,59}$/.test(trimmed);
      } else {
        // Base58 validation (alphanumeric, no 0, O, I, l)
        return /^[123mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed);
      }

    } catch (error: any) {
      logger.error('Failed to validate wallet address', { error: error.message, walletAddress });
      return false;
    }
  }

  /**
   * Get transaction details
   * @param txHashOrTicketId - Transaction hash or ticket ID
   * @returns Transaction details
   */
  async getTransaction(txHashOrTicketId: string): Promise<any> {
    try {
      logger.info(`Fetching transaction ${txHashOrTicketId}`);

      // Mock mode
      if (this.useMockMode) {
        return {
          hash: txHashOrTicketId,
          status: 'confirmed',
          blockNumber: 12345,
          timestamp: new Date().toISOString()
        };
      }

      // Real MNEE SDK call
      // The MNEE SDK uses ticketId for tracking, not direct tx hash lookup
      // If this is a ticketId (UUID format), use getTxStatus
      const isTicketId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(txHashOrTicketId);

      if (isTicketId) {
        const status = await this.mnee.getTxStatus(txHashOrTicketId);
        return {
          hash: status.tx_id || txHashOrTicketId,
          ticketId: status.id,
          status: status.status,
          txHex: status.tx_hex,
          createdAt: status.createdAt,
          updatedAt: status.updatedAt,
          errors: status.errors
        };
      } else {
        // If it's a tx hash, we need to return basic info
        // MNEE SDK doesn't have a direct method to query by tx hash
        logger.warn('Transaction lookup by hash not directly supported by MNEE SDK', { txHash: txHashOrTicketId });
        return {
          hash: txHashOrTicketId,
          status: 'unknown',
          message: 'Direct transaction hash lookup not supported. Use ticket ID for status tracking.'
        };
      }

    } catch (error: any) {
      logger.error('Failed to get transaction', { error: error.message, txHashOrTicketId });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }
}
