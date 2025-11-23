/**
 * Ethereum Service
 * Handles MNEE ERC-20 token interactions on Ethereum blockchain
 * Replaces the previous Bitcoin-based mneeService for hackathon pivot
 */

import { ethers } from 'ethers';
import { logger } from '../middleware/logger';

const MNEE_TOKEN_ADDRESS = process.env.MNEE_TOKEN_ADDRESS || '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY;
const MOCK_MODE = !PLATFORM_PRIVATE_KEY || process.env.NODE_ENV === 'test';

// Minimal ERC-20 ABI for MNEE token interactions
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export class EthereumService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private mneeToken: ethers.Contract | null = null;
  private mockMode: boolean = MOCK_MODE;

  constructor() {
    if (this.mockMode) {
      logger.warn('⚠️  EthereumService running in MOCK MODE', {
        reason: PLATFORM_PRIVATE_KEY ? 'test environment' : 'missing PLATFORM_PRIVATE_KEY',
        note: 'Set PLATFORM_PRIVATE_KEY in .env for real Ethereum interactions'
      });
      return;
    }

    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

      // Initialize platform wallet
      this.wallet = new ethers.Wallet(PLATFORM_PRIVATE_KEY!, this.provider);

      // Initialize MNEE token contract
      this.mneeToken = new ethers.Contract(
        MNEE_TOKEN_ADDRESS,
        ERC20_ABI,
        this.wallet
      );

      logger.info('✅ EthereumService initialized', {
        network: ETHEREUM_RPC_URL,
        tokenAddress: MNEE_TOKEN_ADDRESS,
        platformWallet: this.wallet.address
      });
    } catch (error: any) {
      logger.error('Failed to initialize EthereumService', { error: error.message });
      this.mockMode = true;
      logger.warn('⚠️  Falling back to MOCK MODE');
    }
  }

  /**
   * Get MNEE token balance for an address
   */
  async getBalance(address: string): Promise<number> {
    if (this.mockMode) {
      logger.info('MOCK: Getting balance', { address });
      return 10000; // Mock balance
    }

    try {
      if (!this.mneeToken) throw new Error('MNEE token contract not initialized');

      // Validate address
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid Ethereum address: ${address}`);
      }

      const balance = await this.mneeToken.balanceOf(address);
      const decimals = await this.mneeToken.decimals();

      // Convert from wei to human-readable (MNEE has 18 decimals)
      const balanceFormatted = Number(ethers.formatUnits(balance, decimals));

      logger.info('Balance retrieved', { address, balance: balanceFormatted });
      return balanceFormatted;
    } catch (error: any) {
      logger.error('Failed to get MNEE balance', {
        error: error.message,
        address
      });
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Execute salary transfer (payroll)
   * Transfers MNEE from platform wallet to employee
   */
  async executeSalaryTransfer(
    fromEmployerAddress: string,
    toEmployeeAddress: string,
    amount: number
  ): Promise<string> {
    if (this.mockMode) {
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;
      logger.info('MOCK: Salary transfer', {
        from: fromEmployerAddress,
        to: toEmployeeAddress,
        amount,
        txHash: mockTxHash
      });
      return mockTxHash;
    }

    try {
      if (!this.mneeToken) throw new Error('MNEE token contract not initialized');
      if (!this.wallet) throw new Error('Platform wallet not initialized');

      // Validate addresses
      if (!ethers.isAddress(toEmployeeAddress)) {
        throw new Error(`Invalid employee address: ${toEmployeeAddress}`);
      }

      const decimals = await this.mneeToken.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Execute transfer from platform wallet to employee
      const tx = await this.mneeToken.transfer(toEmployeeAddress, amountWei);

      logger.info('Salary transfer initiated', {
        employer: fromEmployerAddress,
        employee: toEmployeeAddress,
        amount,
        txHash: tx.hash
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      logger.info('Salary transfer confirmed', {
        employee: toEmployeeAddress,
        amount,
        txHash: receipt!.hash,
        blockNumber: receipt!.blockNumber,
        gasUsed: receipt!.gasUsed.toString()
      });

      return receipt!.hash;
    } catch (error: any) {
      logger.error('Salary transfer failed', {
        error: error.message,
        employer: fromEmployerAddress,
        employee: toEmployeeAddress,
        amount
      });
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer MNEE from user to platform (deposit)
   * NOTE: Requires user to approve() first via frontend
   * This is called by backend after user approves on frontend
   */
  async depositFromUser(
    userAddress: string,
    amount: number
  ): Promise<string> {
    if (this.mockMode) {
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;
      logger.info('MOCK: Deposit from user', {
        from: userAddress,
        amount,
        txHash: mockTxHash
      });
      return mockTxHash;
    }

    try {
      if (!this.mneeToken) throw new Error('MNEE token contract not initialized');
      if (!this.wallet) throw new Error('Platform wallet not initialized');

      const decimals = await this.mneeToken.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Transfer from user to platform wallet using transferFrom
      // User must have called approve(platformAddress, amount) first
      const tx = await this.mneeToken.transferFrom(
        userAddress,
        this.wallet.address,
        amountWei
      );

      logger.info('Deposit initiated', {
        from: userAddress,
        to: this.wallet.address,
        amount,
        txHash: tx.hash
      });

      const receipt = await tx.wait();
      return receipt!.hash;
    } catch (error: any) {
      logger.error('Deposit failed', {
        error: error.message,
        userAddress,
        amount
      });

      // Provide helpful error messages
      if (error.message.includes('ERC20InsufficientAllowance')) {
        throw new Error('User must approve MNEE token spend first via wallet');
      }
      if (error.message.includes('ERC20InsufficientBalance')) {
        throw new Error('User has insufficient MNEE balance');
      }

      throw new Error(`Deposit failed: ${error.message}`);
    }
  }

  /**
   * Withdraw MNEE from platform to user
   * Transfers from platform wallet to user address
   */
  async withdrawToUser(
    userAddress: string,
    amount: number
  ): Promise<string> {
    if (this.mockMode) {
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;
      logger.info('MOCK: Withdrawal to user', {
        to: userAddress,
        amount,
        txHash: mockTxHash
      });
      return mockTxHash;
    }

    try {
      if (!this.mneeToken) throw new Error('MNEE token contract not initialized');
      if (!this.wallet) throw new Error('Platform wallet not initialized');

      // Validate address
      if (!ethers.isAddress(userAddress)) {
        throw new Error(`Invalid user address: ${userAddress}`);
      }

      const decimals = await this.mneeToken.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Check platform wallet has sufficient balance
      const platformBalance = await this.mneeToken.balanceOf(this.wallet.address);
      if (platformBalance < amountWei) {
        throw new Error('Platform wallet has insufficient MNEE balance');
      }

      // Execute transfer
      const tx = await this.mneeToken.transfer(userAddress, amountWei);

      logger.info('Withdrawal initiated', {
        from: this.wallet.address,
        to: userAddress,
        amount,
        txHash: tx.hash
      });

      const receipt = await tx.wait();
      return receipt!.hash;
    } catch (error: any) {
      logger.error('Withdrawal failed', {
        error: error.message,
        userAddress,
        amount
      });
      throw new Error(`Withdrawal failed: ${error.message}`);
    }
  }

  /**
   * Validate Ethereum address
   */
  validateWalletAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string) {
    if (this.mockMode) {
      logger.info('MOCK: Getting transaction', { txHash });
      return {
        hash: txHash,
        blockNumber: 123456,
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: MNEE_TOKEN_ADDRESS,
        value: '0',
        confirmations: 12
      };
    }

    try {
      if (!this.provider) throw new Error('Provider not initialized');

      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      logger.info('Transaction retrieved', { txHash, blockNumber: tx.blockNumber });
      return tx;
    } catch (error: any) {
      logger.error('Failed to get transaction', {
        error: error.message,
        txHash
      });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Get platform wallet address
   */
  getPlatformWalletAddress(): string {
    if (this.mockMode) {
      return '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';  // Mock address
    }

    if (!this.wallet) {
      throw new Error('Platform wallet not initialized');
    }

    return this.wallet.address;
  }

  /**
   * Get MNEE token info
   */
  async getTokenInfo() {
    if (this.mockMode) {
      return {
        name: 'MNEE Stablecoin',
        symbol: 'MNEE',
        decimals: 18,
        address: MNEE_TOKEN_ADDRESS
      };
    }

    try {
      if (!this.mneeToken) throw new Error('MNEE token contract not initialized');

      const [name, symbol, decimals] = await Promise.all([
        this.mneeToken.name(),
        this.mneeToken.symbol(),
        this.mneeToken.decimals()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        address: MNEE_TOKEN_ADDRESS
      };
    } catch (error: any) {
      logger.error('Failed to get token info', { error: error.message });
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }
}

export const ethereumService = new EthereumService();
