'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { payrollAPI, employeeAPI, riskAPI, type PayrollLog, type Employee, type EmployeeRiskResult } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatWalletAddress, formatDateTime, getStatusColor, getEtherscanTxUrl } from '@/lib/utils'
import { PlayCircle, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw, Shield, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { RiskBadge } from '@/components/RiskBadge'
import { InfoTooltip } from '@/components/InfoTooltip'

export default function PayrollPage() {
  const router = useRouter()
  const { employer, isConnected } = useStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollHistory, setPayrollHistory] = useState<PayrollLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [riskResults, setRiskResults] = useState<EmployeeRiskResult[]>([])
  const [screeningRisk, setScreeningRisk] = useState(false)
  const [showRiskDetails, setShowRiskDetails] = useState(false)

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

  const handleScreenEmployees = async () => {
    if (!employer) return

    setScreeningRisk(true)
    try {
      const res = await riskAPI.screenEmployees(employer.id)
      setRiskResults(res.data.data.results)
      setShowRiskDetails(true)

      const summary = res.data.data.summary
      if (summary.blocked > 0) {
        toast.warning('Blocked Wallets', `${summary.blocked} employee(s) blocked. Check details below.`)
      } else if (summary.risky > 0) {
        toast.warning('Review Required', `${summary.risky} employee(s) need review.`)
      } else {
        toast.success('All Clear', `All ${summary.safe} employees passed screening.`)
      }
    } catch (error: any) {
      toast.error('Screening Failed', error.response?.data?.message || 'Failed to screen employees')
    } finally {
      setScreeningRisk(false)
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

  return (
    <div className="container mx-auto px-4 py-8 pt-24 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-gray-600 mt-1">Create payroll approvals and view payment history</p>
      </div>

      {/* Run Payroll Card */}
      <Card>
        <CardHeader>
          <CardTitle>Run Payroll</CardTitle>
          <CardDescription>
            Review employee list and create payment approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {employees.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Security First</p>
                  <p className="text-xs text-blue-700 leading-relaxed mb-2">
                    We recommend screening all employees before running payroll to detect any high-risk wallets.
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    Click "Screen All Employees" to check for sanctions, scams, and suspicious activity.
                  </p>
                </div>
              </div>
            </div>
          )}
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

          <div className="flex gap-3">
            <Button
              onClick={handleScreenEmployees}
              disabled={screeningRisk || employees.length === 0}
              size="lg"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
            >
              {screeningRisk ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Screening...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Screen All Employees
                </>
              )}
            </Button>
            <Button
              onClick={handleRunPayroll}
              disabled={running || employees.length === 0}
              size="lg"
              className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200"
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
          </div>
        </CardContent>
      </Card>

      {/* Risk Screening Results */}
      {showRiskDetails && riskResults.length > 0 && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Security Screening Results
                  <InfoTooltip content="This screening checks employee wallets against sanctions lists, known scams, and analyzes transaction patterns, wallet age, and balance behavior." size="md" />
                </CardTitle>
                <CardDescription>
                  {riskResults.filter(r => r.action === 'block').length > 0
                    ? `${riskResults.filter(r => r.action === 'block').length} high-risk wallet(s) detected`
                    : riskResults.filter(r => r.action === 'warn').length > 0
                    ? `${riskResults.filter(r => r.action === 'warn').length} wallet(s) require review`
                    : 'All employees cleared for payroll'}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRiskDetails(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Summary Stats */}
            {riskResults.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{riskResults.length}</div>
                  <div className="text-xs text-gray-600">Total Scanned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {riskResults.filter(r => r.action === 'proceed').length}
                  </div>
                  <div className="text-xs text-gray-600">Safe</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {riskResults.filter(r => r.action === 'warn').length}
                  </div>
                  <div className="text-xs text-gray-600">Warning</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {riskResults.filter(r => r.action === 'block').length}
                  </div>
                  <div className="text-xs text-gray-600">Blocked</div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {riskResults.map((result) => (
                <div
                  key={result.employeeId}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    result.action === 'block'
                      ? 'border-red-300 bg-red-50'
                      : result.action === 'warn'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="font-semibold text-gray-900">{result.employeeName}</div>
                        <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded">
                          {formatWalletAddress(result.walletAddress)}
                        </span>
                        <span className="text-sm font-medium text-gray-700 bg-white px-2 py-0.5 rounded">
                          {formatCurrency(result.salaryAmount)}
                        </span>
                        {!result.canPayroll && (
                          <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded animate-pulse">
                            🚫 BLOCKED
                          </span>
                        )}
                      </div>
                      <RiskBadge
                        riskLevel={result.riskLevel as any}
                        riskScore={result.riskScore}
                        summary={result.summary}
                        action={result.action as any}
                        compact={false}
                        showDetails={true}
                      />
                    </div>
                    {!result.canPayroll && (
                      <div className="flex-shrink-0">
                        <div className="rounded-full bg-red-200 p-3 animate-pulse">
                          <AlertTriangle className="h-6 w-6 text-red-700" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Critical Warning Banner */}
            {riskResults.filter(r => r.action === 'block').length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">
                      ⛔ CRITICAL SECURITY ALERT
                    </p>
                    <p className="text-sm text-red-800 leading-relaxed">
                      <strong>{riskResults.filter(r => r.action === 'block').length} employee(s)</strong> have been <strong>BLOCKED</strong> and will be <strong>automatically excluded</strong> from payroll due to:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-red-700 ml-4 list-disc">
                      <li>OFAC sanctions (US Treasury blocked addresses)</li>
                      <li>Tornado Cash mixer usage (privacy service)</li>
                      <li>Known scam/fraud addresses</li>
                      <li>Critical risk score (81-100)</li>
                    </ul>
                    <p className="mt-2 text-xs text-red-800 font-semibold">
                      ⚠️ Do NOT attempt to pay these wallets manually. Contact compliance immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Banner for Risky Wallets */}
            {riskResults.filter(r => r.action === 'warn').length > 0 && riskResults.filter(r => r.action === 'block').length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-900 mb-1">
                      ⚠️ Manual Review Required
                    </p>
                    <p className="text-sm text-yellow-800">
                      {riskResults.filter(r => r.action === 'warn').length} employee(s) flagged with medium/high risk. Review recommended before proceeding with payroll.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {riskResults.filter(r => r.action === 'block').length === 0 && riskResults.filter(r => r.action === 'warn').length === 0 && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-900 mb-1">
                      ✅ All Clear - Safe to Proceed
                    </p>
                    <p className="text-sm text-green-800">
                      All employees passed security screening. No high-risk wallets detected. You can safely run payroll.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll History */}
      <Card>
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
    </div>
  )
}
