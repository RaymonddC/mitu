'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { payrollAPI, employeeAPI, type PayrollLog, type Employee } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatWalletAddress, formatDateTime, getStatusColor, getEtherscanTxUrl } from '@/lib/utils'
import { PlayCircle, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw, History, Wallet } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { WalletApproval } from '@/components/WalletApproval'

type TabType = 'run' | 'history' | 'approvals';

export default function PayrollPage() {
  const router = useRouter()
  const { employer, isConnected } = useStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollHistory, setPayrollHistory] = useState<PayrollLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('run')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    // Redirect to company selection if no employer selected
    if (!employer && !loading) {
      router.push('/select-company')
      return
    }

    if (employer) {
      loadData()
    }
  }, [isConnected, employer, loading])

  // Auto-refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && employer) {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [employer])

  const loadData = async () => {
    if (!employer) return

    try {
      const [empRes, histRes] = await Promise.all([
        employeeAPI.list(employer.id),
        payrollAPI.history(employer.id)
      ])
      setEmployees(empRes.data.data)
      setPayrollHistory(histRes.data.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to Load', 'Could not load payroll data')
    } finally {
      setLoading(false)
    }
  }

  const handleRunPayroll = async () => {
    if (!employer) return

    if (!confirm(`Create payroll approval for ${employees.length} employees? You will sign with your wallet.`)) {
      return
    }

    setRunning(true)

    try {
      const res = await payrollAPI.run({
        employerId: employer.id,
        useWalletSigning: true // Always use wallet signing
      })

      // Always expects approval (non-custodial mode only)
      toast.success('Approval Created', 'Payroll approval created successfully. Go to Pending Approvals tab to approve with your wallet.')

      // Refresh the page data to show the pending approval
      await loadData()

      // Switch to the approvals tab
      setActiveTab('approvals')

    } catch (error: any) {
      console.error('Failed to create approval:', error)
      toast.error('Failed to Create Approval', error.response?.data?.message || 'Failed to create payroll approval')
    } finally {
      setRunning(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadData()
      toast.success('Refreshed', 'Payroll history updated')
    } catch (error: any) {
      toast.error('Refresh Failed', error.response?.data?.message || 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleRetry = async (logId: string) => {
    try {
      await payrollAPI.retry(logId)
      toast.success('Retry Initiated', 'Payroll payment will be retried')
      await loadData()
    } catch (error: any) {
      toast.error('Retry Failed', error.response?.data?.message || 'Failed to retry payroll')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex justify-center py-12">Loading...</div>
      </div>
    )
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salaryAmount), 0)

  const tabs = [
    { id: 'run' as TabType, label: 'Run Payroll', icon: PlayCircle },
    { id: 'approvals' as TabType, label: 'Pending Approvals', icon: Wallet },
    { id: 'history' as TabType, label: 'Payment History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative container mx-auto px-4 md:px-6 py-8 pt-24 space-y-8">
        <div className="mb-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Payroll Management
          </h1>
          <p className="text-gray-300 mt-3 text-base md:text-lg">Create payroll approvals and view payment history</p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-white/20 mt-6">
          <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors text-sm md:text-base ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6 md:space-y-8">
          {/* Run Payroll Tab */}
          {activeTab === 'run' && (
            <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-xl md:text-2xl">Run Payroll</CardTitle>
                <CardDescription className="text-gray-400 text-sm md:text-base mt-2">
                  Review employee list and create payment approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-white/20 bg-white/5 p-5 md:p-6">
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <div className="text-xs md:text-sm text-gray-400 mb-2">Total Employees</div>
                      <div className="text-xl md:text-2xl font-bold text-white">{employees.length}</div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm text-gray-400 mb-2">Total Amount</div>
                      <div className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalPayroll)}</div>
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <div className="text-xs md:text-sm text-gray-400 mb-2">Status</div>
                      <div className="text-xl md:text-2xl font-bold text-white">
                        {running ? 'Running...' : 'Ready'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 border border-white/20 p-5 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg md:text-xl">🔐</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-2 text-base md:text-lg">Non-Custodial Wallet Signing</h3>
                      <p className="text-sm md:text-base text-gray-300">
                        This system uses <strong>wallet signing only</strong>. When you run payroll, an approval will be created.
                        You'll then sign the transactions with your MetaMask wallet. Your funds stay in your wallet - maximum security!
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleRunPayroll}
                  disabled={running || employees.length === 0}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-white text-sm md:text-base py-6"
                >
                  {running ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                      <span>Creating Approval...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      <span>Create Payroll Approval</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending Approvals Tab */}
          {activeTab === 'approvals' && employer && (
            <div>
              <WalletApproval
                employerId={employer.id}
                onApprovalComplete={loadData}
              />
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-white text-xl md:text-2xl">Payment History</CardTitle>
                    <CardDescription className="text-gray-400 text-sm md:text-base mt-2">Recent salary executions</CardDescription>
                  </div>
                  <Button
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payrollHistory.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-base md:text-lg">No payroll history yet. Run your first payroll!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payrollHistory.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4 md:p-5 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                          <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                            {log.status === 'completed' && <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-400" />}
                            {log.status === 'pending' && <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />}
                            {log.status === 'failed' && <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white text-sm md:text-base truncate">
                              {log.employee?.name || 'Unknown Employee'}
                            </div>
                            <div className="text-xs md:text-sm text-gray-400 truncate">
                              {log.employee?.walletAddress && formatWalletAddress(log.employee.walletAddress)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <div className="text-left sm:text-right">
                            <div className="font-semibold text-white text-sm md:text-base">{formatCurrency(Number(log.amount))}</div>
                            <div className="text-xs text-gray-400">{formatDateTime(log.executedAt)}</div>
                          </div>

                          <div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {log.txHash && (
                              <Button
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white"
                                onClick={() => window.open(getEtherscanTxUrl(log.txHash!, Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID) || 1), '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}

                            {log.status === 'failed' && log.retryCount < 3 && (
                              <Button
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                                onClick={() => handleRetry(log.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Retry</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
