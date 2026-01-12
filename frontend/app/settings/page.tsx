'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAccount, useWalletClient } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Zap, Shield, Info, Building2, DollarSign } from 'lucide-react';
import { isBatchTransferAvailable, calculateGasSavings, getBatchContractAddress } from '@/lib/batchTransferABI';
import { checkBatchApproval, approveBatchContract, revokeBatchApproval, getBatchApprovalStatus } from '@/lib/batchApproval';
import { CompanyCustomization } from '@/components/CompanyCustomization';

type TabType = 'company' | 'payments';

export default function SettingsPage() {
  const router = useRouter();
  const { walletAddress, isConnected, employer } = useStore();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('company');
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

    // Redirect to company selection if no employer selected
    if (!employer && !loading) {
      router.push('/select-company');
      return;
    }

    setLoading(false);
  }, [isConnected, walletAddress, employer, loading, router]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 flex items-center justify-center">
        <div className="text-lg text-gray-300">Loading...</div>
      </div>
    );
  }

  const employeeCount = employer?.employees?.length || 3;
  const costData = calculateGasSavings(employeeCount);

  const tabs = [
    { id: 'company' as TabType, label: 'Company Profile', icon: Building2 },
    { id: 'payments' as TabType, label: 'Payment Settings', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Settings</h1>
          <p className="text-gray-300 text-lg">Manage your company and payroll preferences</p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-white/20">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Company Profile Tab */}
        {activeTab === 'company' && (
          <CompanyCustomization employer={employer} onUpdate={() => window.location.reload()} />
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'payments' && (
          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white">Batch Transfers</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Pay all employees in one transaction to save on gas costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!batchAvailable ? (
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Batch transfers not available</p>
                      <p className="text-sm text-gray-300 mt-1">
                        The batch transfer contract is not deployed. Contact support or deploy the contract to enable this feature.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      {isBatchApproved ? (
                        <>
                          <div className="h-10 w-10 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center border border-green-400/30">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Batch Transfers Enabled</p>
                            <p className="text-sm text-gray-300">You can use batch mode when approving payroll</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center border border-white/20">
                            <XCircle className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Batch Transfers Disabled</p>
                            <p className="text-sm text-gray-300">Enable to save on gas costs</p>
                          </div>
                        </>
                      )}
                    </div>
                    <Badge variant={isBatchApproved ? "default" : "secondary"} className={isBatchApproved ? "bg-green-500/30 text-green-300 border border-green-400/30" : "bg-white/10 text-gray-300 border border-white/20"}>
                      {isBatchApproved ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Cost Comparison */}
                  <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-purple-400/30 rounded-xl p-5 space-y-3">
                    <button
                      onClick={() => setShowCostComparison(!showCostComparison)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-400" />
                        <span className="font-semibold text-white">Cost Savings</span>
                      </div>
                      <span className="text-sm text-blue-300">
                        {showCostComparison ? 'Hide' : 'Show'} Details
                      </span>
                    </button>

                    {showCostComparison && (
                      <div className="bg-white/5 rounded-lg border border-white/20 p-5 space-y-4">
                        <p className="text-sm text-gray-300 font-medium">
                          Based on {employeeCount} employees per payroll:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-sm text-gray-400 mb-2">Individual Transfers:</p>
                            <p className="text-xl font-bold text-white">${costData.individual.costUSD}</p>
                            <p className="text-sm text-gray-400 mt-1.5">{employeeCount} transactions</p>
                          </div>
                          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/30">
                            <p className="text-sm text-purple-300 mb-2">Batch Transfer:</p>
                            <p className="text-xl font-bold text-white">${costData.batch.costUSD}</p>
                            <p className="text-sm text-purple-300 mt-1.5">1 transaction</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/20">
                          <span className="text-sm font-semibold text-gray-300">You save per payroll:</span>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">${costData.savings.costUSD}</p>
                            <p className="text-sm text-green-300">{costData.savings.percent}% cheaper</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contract Info */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-400/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-white">Batch Contract Address</p>
                        <p className="text-xs font-mono text-cyan-300 mt-1 break-all">{batchContractAddress}</p>
                        <p className="text-xs text-gray-300 mt-2">
                          This contract only has permission to transfer MNEE tokens you explicitly approve. It cannot access other tokens or perform any other actions.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {isBatchApproved ? (
                      <Button
                        onClick={handleRevokeBatchApproval}
                        disabled={revokingBatch}
                        variant="outline"
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
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
                    ) : (
                      <Button
                        onClick={handleApproveBatchContract}
                        disabled={approvingBatch}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white"
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
                    )}
                  </div>

                  {/* Warning */}
                  <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-400/30 rounded-xl p-3">
                    <div className="flex items-start gap-2 text-sm text-amber-300">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Important:</p>
                        <p className="text-xs mt-1 text-gray-300">
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
        )}
      </div>
      </div>
    </div>
  );
}
