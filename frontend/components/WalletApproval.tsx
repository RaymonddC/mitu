'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Wallet, Zap, Info, Lock, ArrowRight } from 'lucide-react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, encodeFunctionData, erc20Abi, formatEther } from 'viem';
import axios from 'axios';
import { BATCH_TRANSFER_ABI, getBatchContractAddress, isBatchTransferAvailable, calculateGasSavings } from '@/lib/batchTransferABI';
import { checkBatchApproval, approveBatchContract } from '@/lib/batchApproval';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PendingApproval {
  id: string;
  totalAmount: number;
  recipientCount: number;
  recipients: Array<{
    employeeId: string;
    name: string;
    address: string;
    amount: number;
  }>;
  createdAt: string;
  expiresAt: string;
  status: string;
  description?: string;
  unsignedTx?: {
    type: string;
    recipients: Array<{
      to: string;
      amount: number;
    }>;
    totalAmount: number;
    tokenAddress: string;
  };
}

interface WalletApprovalProps {
  employerId: string;
  onApprovalComplete?: () => void;
}

export function WalletApproval({ employerId, onApprovalComplete }: WalletApprovalProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [useBatchMode, setUseBatchMode] = useState(false);
  const [showCostComparison, setShowCostComparison] = useState(false);
  const [isBatchApproved, setIsBatchApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approvingBatch, setApprovingBatch] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [confirmingTxs, setConfirmingTxs] = useState<Set<string>>(new Set()); // Track confirming transactions
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const batchAvailable = isBatchTransferAvailable();

  useEffect(() => {
    fetchPendingApprovals();
    // Poll for new approvals every 30 seconds
    const interval = setInterval(fetchPendingApprovals, 30000);
    return () => clearInterval(interval);
  }, [employerId]);

  // Check batch approval status when wallet connects or batch becomes available
  useEffect(() => {
    if (batchAvailable && walletClient && address) {
      checkBatchApprovalStatus();
    }
  }, [batchAvailable, walletClient, address]);

  const checkBatchApprovalStatus = async () => {
    if (!walletClient || !address || !batchAvailable) return;

    setCheckingApproval(true);
    try {
      const tokenAddress = process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS;
      if (!tokenAddress) {
        console.error('Token address not configured');
        return;
      }

      const approved = await checkBatchApproval(walletClient, address, tokenAddress);
      setIsBatchApproved(approved);

      // Auto-enable batch mode if approved, or disable if revoked
      if (approved) {
        setUseBatchMode(true);
      } else if (useBatchMode) {
        setUseBatchMode(false);
      }
    } catch (error) {
      console.error('Failed to check batch approval:', error);
      setIsBatchApproved(false);
    } finally {
      setCheckingApproval(false);
    }
  };

  const handleApproveBatchContract = async () => {
    if (!walletClient || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setApprovingBatch(true);
    try {
      const tokenAddress = process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS;
      if (!tokenAddress) {
        throw new Error('Token address not configured');
      }

      const hash = await approveBatchContract(walletClient, address, tokenAddress);

      alert(`✅ Batch contract approved! Transaction hash: ${hash.slice(0, 10)}...`);

      // Recheck approval status
      await checkBatchApprovalStatus();
    } catch (error: any) {
      console.error('Batch approval failed:', error);
      alert(error.message || 'Failed to approve batch contract. Please try again.');
    } finally {
      setApprovingBatch(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/approvals`, {
        params: { employerId, status: 'pending' }
      });
      setApprovals(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch approvals', error);
    }
  };

  const handleApprove = async (approval: PendingApproval) => {
    if (!walletClient || !address) {
      alert('Please connect your wallet first');
      return;
    }

    // Show confirmation dialog first
    setPendingApproval(approval);
    setShowConfirmDialog(true);
  };

  const executeApproval = async () => {
    if (!walletClient || !address || !pendingApproval) return;

    setShowConfirmDialog(false);
    setProcessingId(pendingApproval.id);
    setLoading(true);

    try {
      const approval = pendingApproval;

      // CRITICAL: Check if employees already paid BEFORE executing blockchain transaction
      const validateResponse = await axios.post(`${API_URL}/api/wallet/approvals/${approval.id}/validate`);
      const validation = validateResponse.data?.data;

      if (validation?.allAlreadyPaid) {
        throw new Error(
          `All employees in this approval were already paid today. This transaction would duplicate payments. Please refresh the page.`
        );
      }

      if (validation?.someAlreadyPaid && validation.alreadyPaidEmployees?.length > 0) {
        const names = validation.alreadyPaidEmployees.map((e: any) => e.name).join(', ');
        const confirmed = confirm(
          `⚠️ WARNING: ${names} were already paid today!\n\n` +
          `If you continue, they will receive DUPLICATE PAYMENTS on the blockchain.\n\n` +
          `Do you want to proceed anyway?`
        );

        if (!confirmed) {
          throw new Error('Transaction cancelled by user');
        }
      }

      const tokenAddress = process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS || approval.unsignedTx?.tokenAddress;

      if (!tokenAddress) {
        throw new Error('Token address not configured');
      }

      const txHashes: string[] = [];

      // Batch mode: Use batch contract to send all in one transaction
      if (useBatchMode && batchAvailable) {
        const batchContractAddress = getBatchContractAddress();

        if (!batchContractAddress) {
          throw new Error('Batch contract not deployed');
        }

        // Prepare batch data
        const recipients = approval.recipients.map(r => r.address as `0x${string}`);
        const amounts = approval.recipients.map(r => parseEther(r.amount.toString()));

        // Calculate total amount (sum of all amounts)
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);

        // Encode batch transfer call
        const data = encodeFunctionData({
          abi: BATCH_TRANSFER_ABI,
          functionName: 'batchTransfer',
          args: [
            tokenAddress as `0x${string}`,
            totalAmount,  // ← NOW METAMASK WILL SHOW THIS!
            recipients,
            amounts
          ]
        });

        // Send single batch transaction
        const hash = await walletClient.sendTransaction({
          to: batchContractAddress as `0x${string}`,
          data,
          account: address,
          chain: walletClient.chain
        });

        txHashes.push(hash);

        // Don't show success alert yet - wait for confirmation

      // Start monitoring transaction in background (non-blocking)
      monitorTransactionInBackground(hash, approval.id, approval.recipientCount);

      // Show "Confirming..." message immediately
      alert(`🔄 Transaction submitted! Confirming on blockchain...\n\nHash: ${hash.slice(0, 10)}...\n\nYou can close this page - we'll update the status in the background.`);
      }
      // Individual mode: Send separate transaction for each employee
      else {
        for (const recipient of approval.recipients) {
          // Encode ERC-20 transfer function call
          const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [
              recipient.address as `0x${string}`,
              parseEther(recipient.amount.toString())
            ]
          });

          // Send transaction via wallet
          const hash = await walletClient.sendTransaction({
            to: tokenAddress as `0x${string}`,
            data,
            account: address,
            chain: walletClient.chain
          });

          txHashes.push(hash);
        }

        // Monitor individual transactions (for simplicity, only monitor the first one)
        // In batch mode, we only have 1 transaction anyway
        if (txHashes.length > 0) {
          monitorTransactionInBackground(txHashes[0], approval.id, approval.recipientCount);
        }

        alert(`🔄 ${txHashes.length} transaction(s) submitted! Confirming on blockchain...\n\nYou can close this page - we'll update the status in the background.`);
      }

      // Create pending payment logs in database (BEFORE waiting for confirmation)
      const submitResponse = await axios.post(`${API_URL}/api/wallet/approvals/${approval.id}/submit`, {
        txHash: txHashes.join(','), // Store multiple hashes comma-separated
        status: 'confirming' // Mark as confirming, not completed yet
      });

      // Refresh approvals list (approval should be marked as processing)
      await fetchPendingApprovals();

      if (onApprovalComplete) {
        onApprovalComplete();
      }
    } catch (error: any) {
      console.error('Approval failed', error);
      alert(error.message || 'Failed to approve transaction. Please try again.');
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  };

  /**
   * Monitor transaction confirmation in background (non-blocking)
   * Uses KISS principle: Simple, reliable, user-friendly
   */
  const monitorTransactionInBackground = async (
    txHash: string,
    approvalId: string,
    recipientCount: number
  ) => {
    if (!publicClient) {
      console.error('Public client not available for monitoring');
      return;
    }

    // Add to confirming set
    setConfirmingTxs(prev => new Set(prev).add(txHash));

    try {
      console.log(`[TX Monitor] Started monitoring ${txHash.slice(0, 10)}...`);

      // Wait for 1 confirmation with 2 minute timeout
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        confirmations: 1,
        timeout: 120_000 // 2 minutes
      });

      console.log(`[TX Monitor] Transaction confirmed!`, receipt);

      // Update backend: transaction confirmed
      await axios.patch(`${API_URL}/api/wallet/approvals/${approvalId}/confirm`, {
        txHash,
        status: receipt.status === 'success' ? 'completed' : 'failed',
        blockNumber: receipt.blockNumber.toString()
      });

      // Show success notification
      if (receipt.status === 'success') {
        alert(`✅ Payment confirmed!\n\nPaid ${recipientCount} employee(s) successfully.\n\nTransaction: ${txHash.slice(0, 10)}...`);
      } else {
        alert(`❌ Transaction failed on blockchain!\n\nPlease contact support.\n\nTransaction: ${txHash.slice(0, 10)}...`);
      }

      // Refresh the list
      await fetchPendingApprovals();

      // Call the callback to refresh parent component
      if (onApprovalComplete) {
        onApprovalComplete();
      }

    } catch (error: any) {
      console.error('[TX Monitor] Timeout or error:', error);

      // On timeout: Mark as "timeout_monitoring" - backend will continue monitoring
      try {
        await axios.patch(`${API_URL}/api/wallet/approvals/${approvalId}/confirm`, {
          txHash,
          status: 'timeout_monitoring' // Backend will pick this up
        });

        console.log(`[TX Monitor] Handed off to backend monitoring`);
      } catch (backendError) {
        console.error('[TX Monitor] Failed to notify backend:', backendError);
      }

      // Don't show error to user - just inform them backend is monitoring
      // (User already knows from the initial "Confirming..." message)
    } finally {
      // Remove from confirming set
      setConfirmingTxs(prev => {
        const next = new Set(prev);
        next.delete(txHash);
        return next;
      });
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!confirm('Are you sure you want to reject this payroll approval?')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/wallet/approvals/${approvalId}/reject`, {
        reason: 'Rejected by employer via dashboard'
      });

      alert('Payroll approval rejected');
      await fetchPendingApprovals();
    } catch (error: any) {
      console.error('Rejection failed', error);
      alert('Failed to reject approval');
    }
  };

  if (approvals.length === 0) {
    return (
      <div className="bg-white/5 border border-white/20 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">No pending payroll transactions to approve</h3>
            <p className="text-sm text-gray-300 mt-2">
              When autonomous payroll is ready to execute, approval requests will appear here.
              You'll be able to review and sign transactions with your connected wallet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Pending Approvals ({approvals.length})</h2>
        <Badge variant="secondary" className="bg-white/10 text-gray-300 border-white/20">
          <Clock className="mr-1 h-3 w-3" />
          Auto-refresh
        </Badge>
      </div>

      {approvals.map((approval) => {
        const isExpired = new Date(approval.expiresAt) < new Date();
        const minutesRemaining = Math.max(
          0,
          Math.floor((new Date(approval.expiresAt).getTime() - Date.now()) / 60000)
        );
        const isProcessing = processingId === approval.id;

        return (
          <Card key={approval.id} className={`bg-white/10 backdrop-blur-2xl border-white/20 ${isExpired ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-lg text-white">Payroll Approval Required</CardTitle>
                </div>
                {isExpired ? (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Expired
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-white/10 text-gray-300 border-white/20">
                    <Clock className="mr-1 h-3 w-3" />
                    {minutesRemaining} min remaining
                  </Badge>
                )}
              </div>
              <CardDescription className="text-gray-400">
                Created {new Date(approval.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300 font-medium mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-white">{approval.totalAmount.toLocaleString()} MNEE</p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                  <p className="text-xs text-gray-300 font-medium mb-1">Recipients</p>
                  <p className="text-2xl font-bold text-white flex items-center gap-1">
                    <Users className="h-5 w-5" />
                    {approval.recipientCount}
                  </p>
                </div>
              </div>

              {/* Employee List */}
              <div className="rounded-lg bg-white/5 border border-white/20 p-4">
                <p className="text-sm font-semibold text-white mb-3">Employees:</p>
                <ul className="space-y-2">
                  {approval.recipients.map((recipient, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-500/30 rounded-full flex items-center justify-center border border-blue-400/30">
                          <span className="text-blue-300 font-medium text-xs">
                            {recipient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{recipient.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{recipient.address.slice(0, 10)}...{recipient.address.slice(-8)}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-white">{recipient.amount} MNEE</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Batch Transfer Toggle & Cost Comparison */}
              {batchAvailable && (
                <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-purple-400/30 p-4 space-y-3">
                  {/* Approval Status Banner */}
                  {!isBatchApproved && (
                    <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-amber-200">
                        <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium mb-1 text-white">Batch transfers not enabled yet</p>
                          <p className="text-xs text-amber-300">
                            You need to approve the batch contract once to use batch transfers. This costs ~$1-2 gas (one-time).
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleApproveBatchContract}
                        disabled={approvingBatch || checkingApproval}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                        size="sm"
                      >
                        {approvingBatch ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Approving Contract...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Enable Batch Transfers (~$1-2)
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Batch Toggle */}
                  <div className={`flex items-center justify-between ${!isBatchApproved ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-400" />
                      <label className="font-semibold text-white cursor-pointer" htmlFor="batch-toggle">
                        Use Batch Transfer
                      </label>
                      {checkingApproval && (
                        <span className="text-xs text-gray-400">(checking...)</span>
                      )}
                    </div>
                    <button
                      id="batch-toggle"
                      onClick={() => {
                        if (!isBatchApproved) {
                          alert('Please approve the batch contract first to enable batch transfers.');
                          return;
                        }
                        setUseBatchMode(!useBatchMode);
                      }}
                      disabled={!isBatchApproved}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        useBatchMode ? 'bg-purple-600' : 'bg-gray-300'
                      } ${!isBatchApproved ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          useBatchMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {useBatchMode ? (
                    <div className="flex items-start gap-2 text-sm text-purple-200">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-white">
                        <strong>Batch mode ON:</strong> All {approval.recipientCount} employees will be paid in <strong>1 transaction</strong>. Cheaper and faster!
                      </p>
                    </div>
                  ) : isBatchApproved ? (
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Individual mode: Each employee gets a separate transaction ({approval.recipientCount} MetaMask popups).
                      </p>
                    </div>
                  ) : null}

                  {/* Cost Comparison Button */}
                  <button
                    onClick={() => setShowCostComparison(!showCostComparison)}
                    className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-100 font-medium"
                  >
                    <Info className="h-4 w-4" />
                    {showCostComparison ? 'Hide' : 'Show'} Cost Comparison
                  </button>

                  {/* Cost Comparison Details */}
                  {showCostComparison && (() => {
                    const costData = calculateGasSavings(approval.recipientCount);
                    return (
                      <div className="bg-white/10 rounded-lg border border-purple-300/30 p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-300 mb-1">Individual Transfers:</p>
                            <p className="font-bold text-white">${costData.individual.costUSD}</p>
                            <p className="text-xs text-gray-400">{approval.recipientCount} transactions</p>
                          </div>
                          <div>
                            <p className="text-gray-300 mb-1">Batch Transfer:</p>
                            <p className="font-bold text-purple-300">${costData.batch.costUSD}</p>
                            <p className="text-xs text-gray-400">1 transaction</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-purple-300/30">
                          <span className="text-sm font-medium text-gray-300">You save:</span>
                          <div className="text-right">
                            <p className="font-bold text-green-400">${costData.savings.costUSD}</p>
                            <p className="text-xs text-green-300">{costData.savings.percent}% cheaper</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleApprove(approval)}
                  disabled={loading || isExpired}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve with Wallet
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleReject(approval.id)}
                  variant="outline"
                  disabled={loading || isExpired}
                  className="px-6"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>

              {/* Expiration Warning */}
              {isExpired && (
                <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/20 border border-amber-400/30 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4" />
                  <p>Transaction expired. A new approval request will be created automatically.</p>
                </div>
              )}

              {/* Wallet Connection Warning */}
              {!address && (
                <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4" />
                  <p>Please connect your wallet to approve this transaction.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-blue-900 border-2 border-purple-400/30">
          <DialogHeader className="pb-3 px-2">
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Wallet className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
              <span className="break-words">Confirm Payroll Transaction</span>
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm mt-2">
              Please review the transaction details before signing with MetaMask
            </DialogDescription>
          </DialogHeader>

          {pendingApproval && (
            <div className="space-y-4 px-2">
              {/* Total Amount Highlight */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-lg p-4 md:p-5">
                <p className="text-xs md:text-sm text-purple-300 font-medium mb-2">Total Amount to Transfer</p>
                <p className="text-2xl md:text-3xl font-bold text-white mb-1 break-words">{pendingApproval.totalAmount.toLocaleString()} MNEE</p>
                <p className="text-xs md:text-sm text-purple-200">to {pendingApproval.recipientCount} employees</p>
              </div>

              {/* Employee Breakdown */}
              <div className="bg-white/5 border border-white/20 rounded-lg p-4 md:p-5 max-h-48 md:max-h-60 overflow-y-auto">
                <p className="text-sm md:text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5" />
                  Employee Breakdown
                </p>
                <div className="space-y-2 md:space-y-3">
                  {pendingApproval.recipients.map((recipient, index) => (
                    <div key={recipient.employeeId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/10 rounded-lg p-3 md:p-3.5 border border-white/20 gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-semibold text-xs border border-purple-400/30">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white text-sm md:text-base truncate">{recipient.name}</p>
                          <p className="text-xs text-gray-400 font-mono break-all sm:break-normal">{recipient.address.slice(0, 8)}...{recipient.address.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0 pl-8 sm:pl-0">
                        <p className="font-bold text-white text-sm md:text-base">{recipient.amount.toLocaleString()} MNEE</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Mode Info */}
              {useBatchMode ? (
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-green-300 mb-1 text-xs md:text-sm">Batch Mode Enabled</p>
                      <p className="text-xs md:text-sm text-green-200 break-words">
                        All {pendingApproval.recipientCount} payments will be processed in <strong>1 transaction</strong>.
                        {(() => {
                          const costData = calculateGasSavings(pendingApproval.recipientCount);
                          return ` Estimated gas: ~$${costData.batch.costUSD} (saving $${costData.savings.costUSD})`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-300 mb-1 text-xs md:text-sm">Individual Mode</p>
                      <p className="text-xs md:text-sm text-blue-200 break-words">
                        You'll need to approve <strong>{pendingApproval.recipientCount} separate transactions</strong> in MetaMask.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MetaMask Warning (only for batch mode) */}
              {useBatchMode && (
                <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-300 mb-1 text-xs md:text-sm">MetaMask Display Limitation</p>
                      <p className="text-xs md:text-sm text-amber-200 mb-2 break-words">
                        Due to MetaMask's limitations, it will only show <strong>{pendingApproval.recipients[0]?.amount.toLocaleString()} MNEE</strong> (first employee's amount) instead of the total <strong>{pendingApproval.totalAmount.toLocaleString()} MNEE</strong>.
                      </p>
                      <p className="text-xs text-amber-200 bg-amber-500/20 rounded p-2 md:p-3 border border-amber-400/30 break-words">
                        <strong>This is normal!</strong> The actual transfer will be {pendingApproval.totalAmount.toLocaleString()} MNEE to all {pendingApproval.recipientCount} employees.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 md:gap-3 pt-4 border-t border-white/20 mt-2 px-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingApproval(null);
              }}
              className="w-full sm:flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={executeApproval}
              className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
            >
              <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              <span className="truncate">Confirm & Sign with MetaMask</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
