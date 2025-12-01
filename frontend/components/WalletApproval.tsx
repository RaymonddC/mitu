'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Wallet } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, encodeFunctionData, erc20Abi } from 'viem';
import axios from 'axios';

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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    fetchPendingApprovals();
    // Poll for new approvals every 30 seconds
    const interval = setInterval(fetchPendingApprovals, 30000);
    return () => clearInterval(interval);
  }, [employerId]);

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

      // For Ethereum ERC-20 transfers, we need to send multiple transactions
      // (one for each employee) or use a batch transfer contract
      // For simplicity, we'll send individual transactions

      const txHashes: string[] = [];

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

      // Submit the transaction hashes to backend
      await axios.post(`${API_URL}/api/wallet/approvals/${approval.id}/submit`, {
        txHash: txHashes.join(',') // Store multiple hashes comma-separated
      });

      alert('Payroll transactions approved and broadcasted successfully!');

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
