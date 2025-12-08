'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Wallet, Zap, Info, Lock } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, encodeFunctionData, erc20Abi } from 'viem';
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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

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

    setProcessingId(approval.id);
    setLoading(true);

    try {
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

        // Encode batch transfer call
        const data = encodeFunctionData({
          abi: BATCH_TRANSFER_ABI,
          functionName: 'batchTransfer',
          args: [
            tokenAddress as `0x${string}`,
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

        alert(`✅ Batch payroll approved! Paid ${approval.recipientCount} employees in 1 transaction!`);
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

        alert(`✅ Payroll approved! Paid ${approval.recipientCount} employees in ${txHashes.length} transactions.`);
      }

      // Submit the transaction hashes to backend
      await axios.post(`${API_URL}/api/wallet/approvals/${approval.id}/submit`, {
        txHash: txHashes.join(',') // Store multiple hashes comma-separated
      });

      // Refresh approvals
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Pending Approvals</CardTitle>
          </div>
          <CardDescription>No pending payroll transactions to approve</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            When autonomous payroll is ready to execute, approval requests will appear here.
            You'll be able to review and sign transactions with your connected wallet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Pending Approvals ({approvals.length})</h2>
        <Badge variant="secondary">
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
          <Card key={approval.id} className={isExpired ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Payroll Approval Required</CardTitle>
                </div>
                {isExpired ? (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Expired
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {minutesRemaining} min remaining
                  </Badge>
                )}
              </div>
              <CardDescription>
                Created {new Date(approval.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-900">{approval.totalAmount.toLocaleString()} MNEE</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-700 font-medium mb-1">Recipients</p>
                  <p className="text-2xl font-bold text-purple-900 flex items-center gap-1">
                    <Users className="h-5 w-5" />
                    {approval.recipientCount}
                  </p>
                </div>
              </div>

              {/* Employee List */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Employees:</p>
                <ul className="space-y-2">
                  {approval.recipients.map((recipient, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-medium text-xs">
                            {recipient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{recipient.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{recipient.address.slice(0, 10)}...{recipient.address.slice(-8)}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{recipient.amount} MNEE</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Batch Transfer Toggle & Cost Comparison */}
              {batchAvailable && (
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200 p-4 space-y-3">
                  {/* Approval Status Banner */}
                  {!isBatchApproved && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-amber-800">
                        <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">Batch transfers not enabled yet</p>
                          <p className="text-xs text-amber-700">
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
                      <Zap className="h-5 w-5 text-purple-600" />
                      <label className="font-semibold text-gray-900 cursor-pointer" htmlFor="batch-toggle">
                        Use Batch Transfer
                      </label>
                      {checkingApproval && (
                        <span className="text-xs text-gray-500">(checking...)</span>
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
                    <div className="flex items-start gap-2 text-sm text-purple-800">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        <strong>Batch mode ON:</strong> All {approval.recipientCount} employees will be paid in <strong>1 transaction</strong>. Cheaper and faster!
                      </p>
                    </div>
                  ) : isBatchApproved ? (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Individual mode: Each employee gets a separate transaction ({approval.recipientCount} MetaMask popups).
                      </p>
                    </div>
                  ) : null}

                  {/* Cost Comparison Button */}
                  <button
                    onClick={() => setShowCostComparison(!showCostComparison)}
                    className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 font-medium"
                  >
                    <Info className="h-4 w-4" />
                    {showCostComparison ? 'Hide' : 'Show'} Cost Comparison
                  </button>

                  {/* Cost Comparison Details */}
                  {showCostComparison && (() => {
                    const costData = calculateGasSavings(approval.recipientCount);
                    return (
                      <div className="bg-white rounded-lg border border-purple-200 p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Individual Transfers:</p>
                            <p className="font-bold text-gray-900">${costData.individual.costUSD}</p>
                            <p className="text-xs text-gray-500">{approval.recipientCount} transactions</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Batch Transfer:</p>
                            <p className="font-bold text-purple-700">${costData.batch.costUSD}</p>
                            <p className="text-xs text-gray-500">1 transaction</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                          <span className="text-sm font-medium text-gray-700">You save:</span>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${costData.savings.costUSD}</p>
                            <p className="text-xs text-green-700">{costData.savings.percent}% cheaper</p>
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4" />
                  <p>Transaction expired. A new approval request will be created automatically.</p>
                </div>
              )}

              {/* Wallet Connection Warning */}
              {!address && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4" />
                  <p>Please connect your wallet to approve this transaction.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
