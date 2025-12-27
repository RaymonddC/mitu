'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAccount, useWalletClient } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Zap, Shield, Info } from 'lucide-react';
import { isBatchTransferAvailable, calculateGasSavings, getBatchContractAddress } from '@/lib/batchTransferABI';
import { checkBatchApproval, approveBatchContract, revokeBatchApproval, getBatchApprovalStatus } from '@/lib/batchApproval';
import { CompanyCustomization } from '@/components/CompanyCustomization';

export default function SettingsPage() {
  const router = useRouter();
  const { walletAddress, isConnected, employer } = useStore();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(true);
  const [isBatchApproved, setIsBatchApproved] = useState(false);
  const [allowanceAmount, setAllowanceAmount] = useState<bigint>(0n);
  const [approvingBatch, setApprovingBatch] = useState(false);
  const [revokingBatch, setRevokingBatch] = useState(false);
  const [showCostComparison, setShowCostComparison] = useState(false);

  const batchAvailable = isBatchTransferAvailable();
  const batchContractAddress = getBatchContractAddress();

  useEffect(() => {
    // Redirect to home if wallet disconnected
    if (!isConnected || !walletAddress) {
      router.push('/');
      return;
    }

    // Redirect to dashboard if employer not set
    if (!employer) {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [isConnected, walletAddress, employer, router]);

  useEffect(() => {
    if (batchAvailable && walletClient && address) {
      checkBatchApprovalStatus();
    }
  }, [batchAvailable, walletClient, address]);

  const checkBatchApprovalStatus = async () => {
    if (!walletClient || !address || !batchAvailable) return;

    try {
      const tokenAddress = process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS;
      if (!tokenAddress) {
        console.error('Token address not configured');
        return;
      }

      const status = await getBatchApprovalStatus(walletClient, address, tokenAddress);
      setIsBatchApproved(status.isApproved);
      setAllowanceAmount(status.allowance);
    } catch (error) {
      console.error('Failed to check batch approval:', error);
      setIsBatchApproved(false);
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

      alert(`Batch contract approved! You can now use batch transfers. Transaction: ${hash.slice(0, 10)}...`);

      // Recheck approval status
      await checkBatchApprovalStatus();
    } catch (error: any) {
      console.error('Batch approval failed:', error);
      alert(error.message || 'Failed to approve batch contract. Please try again.');
    } finally {
      setApprovingBatch(false);
    }
  };

  const handleRevokeBatchApproval = async () => {
    if (!walletClient || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!confirm('Are you sure you want to revoke batch transfer approval? You can always re-enable it later.')) {
      return;
    }

    setRevokingBatch(true);
    try {
      const tokenAddress = process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS;
      if (!tokenAddress) {
        throw new Error('Token address not configured');
      }

      const hash = await revokeBatchApproval(walletClient, address, tokenAddress);

      alert(`Batch approval revoked. Transaction: ${hash.slice(0, 10)}...`);

      // Recheck approval status
      await checkBatchApprovalStatus();
    } catch (error: any) {
      console.error('Batch revoke failed:', error);
      alert(error.message || 'Failed to revoke batch approval. Please try again.');
    } finally {
      setRevokingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const employeeCount = employer?.employees?.length || 3;
  const costData = calculateGasSavings(employeeCount);

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 text-lg">Manage your payroll preferences</p>
      </div>

      <div className="space-y-6">

      {/* Batch Transfer Settings */}
      <Card className="shadow-2xl bg-white backdrop-blur-2xl border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <CardTitle>Batch Transfers</CardTitle>
          </div>
          <CardDescription>
            Pay all employees in one transaction to save on gas costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!batchAvailable ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Batch transfers not available</p>
                  <p className="text-sm text-gray-600 mt-1">
                    The batch transfer contract is not deployed. Contact support or deploy the contract to enable this feature.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/80 to-blue-50/80 rounded-lg border border-purple-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {isBatchApproved ? (
                    <>
                      <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Batch Transfers Enabled</p>
                        <p className="text-sm text-gray-600">You can use batch mode when approving payroll</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Batch Transfers Disabled</p>
                        <p className="text-sm text-gray-600">Enable to save on gas costs</p>
                      </div>
                    </>
                  )}
                </div>
                <Badge variant={isBatchApproved ? "default" : "secondary"} className={isBatchApproved ? "bg-green-600" : ""}>
                  {isBatchApproved ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Cost Comparison */}
              <div className="bg-gradient-to-br from-blue-100/60 via-purple-100/60 to-pink-100/60 border-2 border-purple-300/60 rounded-xl p-4 space-y-3 backdrop-blur-sm shadow-lg">
                <button
                  onClick={() => setShowCostComparison(!showCostComparison)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Cost Savings</span>
                  </div>
                  <span className="text-sm text-purple-700">
                    {showCostComparison ? 'Hide' : 'Show'} Details
                  </span>
                </button>

                {showCostComparison && (
                  <div className="bg-white rounded-lg border border-purple-200 p-4 space-y-3">
                    <p className="text-sm text-gray-700">
                      Based on {employeeCount} employees per payroll:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Individual Transfers:</p>
                        <p className="text-2xl font-bold text-gray-900">${costData.individual.costUSD}</p>
                        <p className="text-xs text-gray-500 mt-1">{employeeCount} transactions</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-purple-700 mb-1">Batch Transfer:</p>
                        <p className="text-2xl font-bold text-purple-900">${costData.batch.costUSD}</p>
                        <p className="text-xs text-purple-600 mt-1">1 transaction</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                      <span className="text-sm font-medium text-gray-700">You save per payroll:</span>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">${costData.savings.costUSD}</p>
                        <p className="text-xs text-green-700">{costData.savings.percent}% cheaper</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Info */}
              <div className="bg-gradient-to-br from-cyan-50/80 to-blue-50/80 border-2 border-cyan-300/60 rounded-xl p-4 space-y-2 backdrop-blur-sm shadow-md">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Batch Contract Address</p>
                    <p className="text-xs font-mono text-blue-700 mt-1 break-all">{batchContractAddress}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      This contract only has permission to transfer MNEE tokens you explicitly approve. It cannot access other tokens or perform any other actions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isBatchApproved ? (
                  <>
                    <Button
                      onClick={handleRevokeBatchApproval}
                      disabled={revokingBatch}
                      variant="outline"
                      className="flex-1"
                    >
                      {revokingBatch ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Revoke Approval
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Back to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back to Dashboard
                    </Button>
                    <Button
                      onClick={handleApproveBatchContract}
                      disabled={approvingBatch}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {approvingBatch ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enable Batch Transfers (~$1-2)
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              {/* Warning */}
              <div className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 border-2 border-amber-300/60 rounded-xl p-3 backdrop-blur-sm shadow-md">
                <div className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Important:</p>
                    <p className="text-xs mt-1">
                      Approving or revoking batch transfers requires a blockchain transaction and costs gas (~$1-2).
                      Once approved, you can toggle batch mode on/off in the payroll approval screen without additional costs.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Company Customization */}
      <CompanyCustomization employer={employer} onUpdate={() => window.location.reload()} />
      </div>
    </div>
  );
}
