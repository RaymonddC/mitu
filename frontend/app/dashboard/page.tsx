'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { employerAPI, employeeAPI, alertAPI, type Alert } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getSeverityColor } from '@/lib/utils';
import { Users, DollarSign, Calendar, AlertCircle, PlayCircle } from 'lucide-react';
import { WalletApproval } from '@/components/WalletApproval';
import { BudgetManagement } from '@/components/BudgetManagement';
import { PayrollAnalytics } from '@/components/PayrollAnalytics';
import { isBatchTransferAvailable, calculateGasSavings } from '@/lib/batchTransferABI';
import { checkBatchApproval, approveBatchContract } from '@/lib/batchApproval';
import { useWalletClient } from 'wagmi';

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
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-primary rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Welcome to MNEE Payroll!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your wallet is connected. Let's set up your employer account to start managing payroll.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Connected Wallet</p>
                  <p className="font-mono text-xs">{walletAddress}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Wallet Connected</p>
                  <p className="text-sm text-gray-600">Ready to create your employer profile</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Set Up Company</p>
                  <p className="text-sm text-gray-600">Provide your company details</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Add Employees</p>
                  <p className="text-sm text-gray-600">Start building your team</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (!employer && showOnboarding) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Create Employer Profile</CardTitle>
            <CardDescription>
              Set up your company details to start managing payroll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <input
                type="text"
                placeholder="e.g., Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={registering}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payroll Day of Month</label>
              <select
                value={payrollDay}
                onChange={(e) => setPayrollDay(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={registering}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                When should employees receive their monthly salary?
              </p>
            </div>

            {/* Batch Transfer Option */}
            {batchAvailable && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
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
                    <label htmlFor="batch-transfer-opt-in" className="font-medium text-gray-900 cursor-pointer">
                      Enable Batch Transfers (Recommended)
                    </label>
                    <p className="text-sm text-gray-700 mt-1">
                      Pay all employees in one transaction instead of separate transactions. Saves gas costs.
                    </p>
                    {(() => {
                      const costData = calculateGasSavings(3);
                      return (
                        <div className="mt-2 text-xs text-purple-800 bg-white rounded-lg border border-purple-100 p-2">
                          <p className="font-medium mb-1">Cost Savings Example (3 employees):</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-gray-600">Individual:</p>
                              <p className="font-bold">${costData.individual.costUSD}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Batch:</p>
                              <p className="font-bold text-purple-700">${costData.batch.costUSD}</p>
                            </div>
                          </div>
                          <p className="mt-2 font-medium text-green-700">
                            Save ${costData.savings.costUSD} ({costData.savings.percent}%) per payroll!
                          </p>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-600 mt-2">
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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2"><strong>Your Wallet:</strong></p>
              <p className="text-xs font-mono text-gray-600 break-all">{walletAddress}</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowOnboarding(false)}
                variant="outline"
                className="flex-1"
                disabled={registering}
              >
                Back
              </Button>
              <Button
                onClick={handleRegisterEmployer}
                disabled={!companyName.trim() || registering || approvingBatch}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {approvingBatch ? 'Approving Batch Transfer...' : registering ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
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

  return (
    <div className="container mx-auto px-4 py-8 pt-24 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Welcome back, {employer.companyName}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/employees')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Users className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
          <Button
            onClick={() => router.push('/payroll')}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Run Payroll
          </Button>
        </div>
      </div>

      {/* Alerts - Show at top if urgent */}
      {alerts.length > 0 && (
        <Card className="shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-900">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-600" />
              Alerts & Recommendations
            </CardTitle>
            <CardDescription className="text-amber-700">Action items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>{alert.severity}</span>
                      <h4 className="font-semibold">{alert.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(alert.createdAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
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

      {/* Pending Approvals - High priority */}
      <WalletApproval employerId={employer.id} onApprovalComplete={loadData} />

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Employees</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900">{employeeCount}</div>
            <p className="text-sm text-blue-700 mt-2 font-medium">Active employees</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Monthly Payroll</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900">{formatCurrency(totalMonthlyPayroll)}</div>
            <p className="text-sm text-green-700 mt-2 font-medium">Total monthly cost</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Next Payday</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-900">{nextPayday.getDate()}</div>
            <p className="text-sm text-purple-700 mt-2 font-medium">{formatDate(nextPayday)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Analytics - Visual insights */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Payroll Analytics</h2>
          <p className="text-gray-600 mt-1">Insights and trends from your payroll data</p>
        </div>
        <PayrollAnalytics
          totalMonthlyPayroll={totalMonthlyPayroll}
          employeeCount={employeeCount}
          employees={employer.employees || []}
        />
      </div>

      {/* Budget Management - Settings/Configuration */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Budget & Automation</h2>
          <p className="text-gray-600 mt-1">Configure pre-authorized budgets for autonomous payroll</p>
        </div>
        <BudgetManagement employerId={employer.id} />
      </div>
    </div>
  );
}
