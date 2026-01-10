/**
 * Transaction Monitor Service
 * Background service to monitor pending blockchain transactions
 * Runs as a cron job every 30 seconds
 * KISS Principle: Simple, reliable, production-ready
 */

import { prisma } from '../server';
import { logger } from '../middleware/logger';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

export class TransactionMonitorService {
  private isRunning = false;

  /**
   * Get Ethereum public client based on environment
   */
  private getPublicClient() {
    const chainId = process.env.ETHEREUM_CHAIN_ID || '1';
    const chain = chainId === '1' ? mainnet : sepolia;

    return createPublicClient({
      chain,
      transport: http()
    });
  }

  /**
   * Monitor all pending transactions
   * Called by cron job every 30 seconds
   */
  async monitorPendingTransactions() {
    // Prevent overlapping runs
    if (this.isRunning) {
      logger.info('[TX Monitor] Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      // Find all PayrollLogs with confirming or timeout_monitoring status
      const pendingLogs = await prisma.payrollLog.findMany({
        where: {
          status: {
            in: ['confirming', 'timeout_monitoring']
          },
          txHash: {
            not: null
          }
        },
        orderBy: {
          executedAt: 'asc'
        },
        take: 50 // Limit to 50 transactions per run (KISS)
      });

      if (pendingLogs.length === 0) {
        return; // No pending transactions
      }

      logger.info(`[TX Monitor] Checking ${pendingLogs.length} pending transactions`);

      const publicClient = this.getPublicClient();

      // Group by txHash (multiple logs can have same txHash in batch mode)
      const txHashMap = new Map<string, typeof pendingLogs>();
      for (const log of pendingLogs) {
        const hash = log.txHash!;
        if (!txHashMap.has(hash)) {
          txHashMap.set(hash, []);
        }
        txHashMap.get(hash)!.push(log);
      }

      // Check each unique transaction
      for (const [txHash, logs] of txHashMap.entries()) {
        try {
          logger.info(`[TX Monitor] Checking transaction ${txHash.slice(0, 10)}...`);

          // Get transaction receipt
          const receipt = await publicClient.getTransactionReceipt({
            hash: txHash as `0x${string}`
          });

          if (receipt) {
            // Transaction is confirmed!
            const status = receipt.status === 'success' ? 'completed' : 'failed';
            const blockNumber = receipt.blockNumber.toString();

            logger.info(`[TX Monitor] Transaction confirmed!`, {
              txHash: txHash.slice(0, 10),
              status,
              blockNumber,
              logsToUpdate: logs.length
            });

            // Update all logs with this txHash
            await prisma.payrollLog.updateMany({
              where: {
                txHash: txHash
              },
              data: {
                status,
                confirmedAt: status === 'completed' ? new Date() : null,
                failureReason: status === 'failed' ? 'Transaction failed on blockchain' : null,
                metadata: {
                  blockNumber,
                  confirmedByMonitor: true,
                  confirmedAt: new Date().toISOString()
                }
              }
            });

            logger.info(`✅ [TX Monitor] Updated ${logs.length} payment logs to ${status}`);
          } else {
            // Transaction still pending - check age
            const oldestLog = logs[0];
            const ageMinutes = (Date.now() - oldestLog.executedAt.getTime()) / 60000;

            if (ageMinutes > 60) {
              // After 60 minutes, mark as failed (likely dropped)
              logger.warn(`[TX Monitor] Transaction stuck for ${ageMinutes.toFixed(0)} minutes, marking as failed`, {
                txHash: txHash.slice(0, 10)
              });

              await prisma.payrollLog.updateMany({
                where: { txHash },
                data: {
                  status: 'failed',
                  failureReason: 'Transaction timeout - not confirmed after 60 minutes'
                }
              });
            } else {
              logger.info(`[TX Monitor] Transaction still pending (${ageMinutes.toFixed(0)} min old)`);
            }
          }

        } catch (error: any) {
          logger.error(`[TX Monitor] Error checking transaction ${txHash.slice(0, 10)}:`, {
            error: error.message
          });
          // Continue with next transaction
        }
      }

    } catch (error: any) {
      logger.error('[TX Monitor] Monitor run failed:', {
        error: error.message,
        stack: error.stack
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start monitoring service (runs every 30 seconds)
   */
  start() {
    logger.info('[TX Monitor] Starting transaction monitor service (30s interval)');

    // Run immediately on start
    this.monitorPendingTransactions();

    // Then run every 30 seconds
    setInterval(() => {
      this.monitorPendingTransactions();
    }, 30000); // 30 seconds
  }
}

export const transactionMonitorService = new TransactionMonitorService();
