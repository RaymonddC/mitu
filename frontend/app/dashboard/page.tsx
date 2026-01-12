'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { employerAPI, employeeAPI, alertAPI, type Alert } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getSeverityColor } from '@/lib/utils';
import { Users, DollarSign, Calendar, AlertCircle, PlayCircle, BarChart3, Settings, Wallet } from 'lucide-react';
import { WalletApproval } from '@/components/WalletApproval';
import { BudgetManagement } from '@/components/BudgetManagement';
import { PayrollAnalytics } from '@/components/PayrollAnalytics';
import { isBatchTransferAvailable, calculateGasSavings } from '@/lib/batchTransferABI';
import { checkBatchApproval, approveBatchContract } from '@/lib/batchApproval';
import { useWalletClient } from 'wagmi';

type TabType = 'overview' | 'approvals' | 'analytics' | 'budget';

export default function DashboardPage() {
  const router = useRouter();
  const { walletAddress, isConnected, employer, setEmployer } = useStore();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [payrollDay, setPayrollDay] = useState(28);
  const [registering, setRegistering] = useState(false);
  const [enableBatchTransfer, setEnableBatchTransfer] = useState(false);
  const [approvingBatch, setApprovingBatch] = useState(false);
  const { data: walletClient } = useWalletClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const batchAvailable = isBatchTransferAvailable();

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

    // Load dashboard data
    loadData();
  }, [isConnected, walletAddress, employer, loading, router]);

  const loadData = async () => {
    if (!walletAddress || !employer) return;

    try {
      // Load alerts for the selected company
      const alertRes = await alertAPI.list(employer.id, { resolved: false });
      setAlerts(alertRes.data.data);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmployer = async () => {
    if (!walletAddress || !companyName.trim()) return;

    setRegistering(true);
    try {
      const response = await employerAPI.create({
        walletAddress,
        companyName: companyName.trim(),
        payrollDay,
      });

      setEmployer(response.data.data);

      // If user opted in for batch transfers, approve the contract
      if (enableBatchTransfer && batchAvailable && walletClient) {
        setApprovingBatch(true);
        try {
          const tokenAddress = process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS;
          if (!tokenAddress) {
            throw new Error('Token address not configured');
          }

          const hash = await approveBatchContract(walletClient, walletAddress, tokenAddress);
          alert(`✅ Employer registered! Batch transfers enabled. Transaction: ${hash.slice(0, 10)}...`);
        } catch (error: any) {
          console.error('Batch approval failed during onboarding:', error);
          alert(`⚠️ Employer registered successfully, but batch approval failed: ${error.message}. You can enable batch transfers later in settings.`);
        } finally {
          setApprovingBatch(false);
        }
      }

      setShowOnboarding(false);
    } catch (error: any) {
      console.error('Failed to register employer:', error);
      alert(error.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!employer && !showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl text-white">Welcome to MNEE Payroll!</CardTitle>
                <CardDescription className="text-lg mt-2 text-gray-300">
                  Your wallet is connected. Let's set up your employer account to start managing payroll.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-white">
                      <p className="font-medium mb-1">Connected Wallet</p>
                      <p className="font-mono text-xs text-blue-300">{walletAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-white">Wallet Connected</p>
                      <p className="text-sm text-gray-300">Ready to create your employer profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-gray-300 font-bold border border-white/20">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-white">Set Up Company</p>
                      <p className="text-sm text-gray-300">Provide your company details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-gray-300 font-bold border border-white/20">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-white">Add Employees</p>
                      <p className="text-sm text-gray-300">Start building your team</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all text-white"
                  size="lg"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!employer && showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Create Employer Profile</CardTitle>
                <CardDescription className="text-gray-300">
                  Set up your company details to start managing payroll
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    disabled={registering}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Payroll Day of Month</label>
                  <select
                    value={payrollDay}
                    onChange={(e) => setPayrollDay(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    disabled={registering}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day} className="bg-slate-800">
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">
                    When should employees receive their monthly salary?
                  </p>
                </div>

                {/* Batch Transfer Option */}
                {batchAvailable && (
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-purple-400/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="batch-transfer-opt-in"
                        checked={enableBatchTransfer}
                        onChange={(e) => setEnableBatchTransfer(e.target.checked)}
                        disabled={registering || approvingBatch}
                        className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="batch-transfer-opt-in" className="font-medium text-white cursor-pointer">
                          Enable Batch Transfers (Recommended)
                        </label>
                        <p className="text-sm text-gray-300 mt-1">
                          Pay all employees in one transaction instead of separate transactions. Saves gas costs.
                        </p>
                        {(() => {
                          const costData = calculateGasSavings(3);
                          return (
                            <div className="mt-2 text-xs text-white bg-white/10 rounded-lg border border-purple-300/30 p-2">
                              <p className="font-medium mb-1">Cost Savings Example (3 employees):</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-gray-300">Individual:</p>
                                  <p className="font-bold text-white">${costData.individual.costUSD}</p>
                                </div>
                                <div>
                                  <p className="text-gray-300">Batch:</p>
                                  <p className="font-bold text-purple-300">${costData.batch.costUSD}</p>
                                </div>
                              </div>
                              <p className="mt-2 font-medium text-green-400">
                                Save ${costData.savings.costUSD} ({costData.savings.percent}%) per payroll!
                              </p>
                            </div>
                          );
                        })()}
                        <p className="text-xs text-gray-300 mt-2">
                          {enableBatchTransfer ? (
                            <>
                              <AlertCircle className="inline h-3 w-3 mr-1" />
                              After registration, you'll approve the batch contract (~$1-2 gas, one-time).
                            </>
                          ) : (
                            "You can enable this later in settings."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Your Wallet:</strong></p>
                  <p className="text-xs font-mono text-gray-400 break-all">{walletAddress}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowOnboarding(false)}
                    variant="outline"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    disabled={registering}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleRegisterEmployer}
                    disabled={!companyName.trim() || registering || approvingBatch}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all text-white"
                  >
                    {approvingBatch ? 'Approving Batch Transfer...' : registering ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Add null check for employer (should not happen due to earlier checks)
  if (!employer) {
    return null;
  }

  const totalMonthlyPayroll = employer.totalMonthlyPayroll || 0;
  const employeeCount = employer.employees?.length || 0;
  const nextPayday = new Date();
  nextPayday.setDate(employer.payrollDay);
  if (nextPayday < new Date()) {
    nextPayday.setMonth(nextPayday.getMonth() + 1);
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'approvals' as TabType, label: 'Pending Approvals', icon: Wallet },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'budget' as TabType, label: 'Budget & Automation', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative container mx-auto px-4 py-8 pt-24 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-300 mt-2 text-lg">Welcome back, {employer.companyName}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/employees')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all text-white"
            >
              <Users className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button
              onClick={() => router.push('/payroll')}
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 shadow-md hover:shadow-lg transition-all text-white"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Payroll
            </Button>
          </div>
        </div>

        {/* Alerts - Show at top if urgent */}
        {alerts.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <AlertCircle className="mr-2 h-5 w-5 text-yellow-400" />
                Alerts & Recommendations
              </CardTitle>
              <CardDescription className="text-gray-400">Action items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>{alert.severity}</span>
                        <h4 className="font-semibold text-white">{alert.title}</h4>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(alert.createdAt)}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      onClick={async () => {
                        await alertAPI.resolve(alert.id);
                        loadData();
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-white/20">
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
        {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Employees</CardTitle>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{employeeCount}</div>
                  <p className="text-sm text-gray-400 mt-2">Active employees</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Monthly Payroll</CardTitle>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{formatCurrency(totalMonthlyPayroll)}</div>
                  <p className="text-sm text-gray-400 mt-2">Total monthly cost</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Next Payday</CardTitle>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{nextPayday.getDate()}</div>
                  <p className="text-sm text-gray-400 mt-2">{formatDate(nextPayday)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pending Approvals Tab */}
          {activeTab === 'approvals' && (
            <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  Pending Approvals
                </CardTitle>
                <CardDescription className="text-gray-400">Transactions waiting for your signature</CardDescription>
              </CardHeader>
              <CardContent>
                <WalletApproval employerId={employer.id} onApprovalComplete={loadData} />
              </CardContent>
            </Card>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  Payroll Analytics
                </CardTitle>
                <CardDescription className="text-gray-400">Insights and trends from your payroll data</CardDescription>
              </CardHeader>
              <CardContent>
                <PayrollAnalytics
                  totalMonthlyPayroll={totalMonthlyPayroll}
                  employeeCount={employeeCount}
                  employees={employer.employees || []}
                />
              </CardContent>
            </Card>
          )}

          {/* Budget & Automation Tab */}
          {activeTab === 'budget' && (
            <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-orange-400" />
                  Budget & Automation
                </CardTitle>
                <CardDescription className="text-gray-400">Configure pre-authorized budgets for autonomous payroll</CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetManagement employerId={employer.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
