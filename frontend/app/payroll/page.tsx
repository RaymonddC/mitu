'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { payrollAPI, employeeAPI, type PayrollLog, type Employee } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatWalletAddress, formatDateTime, getStatusColor, getEtherscanTxUrl } from '@/lib/utils'
import { PlayCircle, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw, History } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

type TabType = 'run' | 'history';

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
      toast.success('Approval Created', 'Redirecting to dashboard to approve with your wallet...')

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

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
    { id: 'history' as TabType, label: 'Payment History', icon: History },
  ];

  return (
    <div className="container mx-auto px-4 py-8 pt-24 space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Payroll Management
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Create payroll approvals and view payment history</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {/* Run Payroll Tab */}
        {activeTab === 'run' && (
          <Card className="shadow-xl bg-white border-2 border-gray-200">
        <CardHeader>
          <CardTitle>Run Payroll</CardTitle>
          <CardDescription>
            Review employee list and create payment approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-2xl font-bold">{employees.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-2xl font-bold">
                  {running ? 'Running...' : 'Ready'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-secondary border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🔐</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Non-Custodial Wallet Signing</h3>
                <p className="text-sm text-muted-foreground">
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
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200"
          >
            {running ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Approval...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Create Payroll Approval
              </>
            )}
          </Button>
        </CardContent>
      </Card>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <Card className="shadow-xl bg-white border-2 border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent salary executions</CardDescription>
            </div>
            <Button
              variant="outline"
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
            <div className="text-center py-12 text-gray-500">
              No payroll history yet. Run your first payroll!
            </div>
          ) : (
            <div className="space-y-3">
              {payrollHistory.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      {log.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {log.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                      {log.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <div className="font-medium">
                        {log.employee?.name || 'Unknown Employee'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {log.employee?.walletAddress && formatWalletAddress(log.employee.walletAddress)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(Number(log.amount))}</div>
                      <div className="text-xs text-gray-500">{formatDateTime(log.executedAt)}</div>
                    </div>

                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>

                    {log.txHash && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(getEtherscanTxUrl(log.txHash!, Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID) || 1), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}

                    {log.status === 'failed' && log.retryCount < 3 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(log.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
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
  )
}
