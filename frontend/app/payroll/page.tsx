'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { payrollAPI, employeeAPI, type PayrollLog, type Employee } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatWalletAddress, formatDateTime, getStatusColor } from '@/lib/utils'
import { PlayCircle, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

export default function PayrollPage() {
  const router = useRouter()
  const { employer, isConnected } = useStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollHistory, setPayrollHistory] = useState<PayrollLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    if (employer) {
      loadData()
    }
  }, [isConnected, employer])

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
      toast({ title: 'Error', description: 'Failed to load payroll data' })
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
      toast({
        title: 'Approval Created',
        description: 'Redirecting to dashboard to approve with your wallet...'
      })

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('Failed to create approval:', error)
      toast({
        title: 'Failed to Create Approval',
        description: error.response?.data?.message || 'Failed to create payroll approval'
      })
    } finally {
      setRunning(false)
    }
  }

  const handleRetry = async (logId: string) => {
    try {
      await payrollAPI.retry(logId)
      toast({ title: 'Success', description: 'Payroll retry initiated' })
      await loadData()
    } catch (error: any) {
      toast({
        title: 'Retry Failed',
        description: error.response?.data?.message || 'Failed to retry payroll'
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salaryAmount), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-gray-600 mt-1">Create payroll approvals and view payment history</p>
      </div>

      {/* Run Payroll Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Payroll Approval</CardTitle>
          <CardDescription>
            Generate approval request for salary payments - you'll sign with your wallet
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

          <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🔐</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">Non-Custodial Wallet Signing</h3>
                <p className="text-sm text-purple-800">
                  This system uses <strong>wallet signing only</strong>. When you run payroll, an approval will be created.
                  You'll then sign the transactions with your MetaMask wallet. Your funds stay in your wallet - maximum security!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRunPayroll}
              disabled={running || employees.length === 0}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent salary executions</CardDescription>
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
                        onClick={() => window.open(`https://explorer.mnee.io/tx/${log.txHash}`, '_blank')}
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
