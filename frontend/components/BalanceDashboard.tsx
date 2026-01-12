'use client'

import { useEffect, useState } from 'react'
import { balanceAPI, type BalanceInfo, type BalanceTransaction } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react'

interface BalanceDashboardProps {
  employerId: string
}

export function BalanceDashboard({ employerId }: BalanceDashboardProps) {
  const [balance, setBalance] = useState<BalanceInfo | null>(null)
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [employerId])

  const loadData = async () => {
    try {
      setRefreshing(true)

      // Load balance info
      const balanceRes = await balanceAPI.getBalance(employerId)
      setBalance(balanceRes.data.data)

      // Load recent transactions
      const txRes = await balanceAPI.getTransactionHistory(employerId, { limit: 10, offset: 0 })
      setTransactions(txRes.data.data.transactions)
    } catch (error) {
      console.error('Failed to load balance data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      alert('Please enter a valid amount')
      return
    }

    try {
      await balanceAPI.deposit(employerId, {
        amount: Number(depositAmount),
        description: 'Manual deposit via dashboard'
      })
      setDepositAmount('')
      setShowDepositForm(false)
      await loadData()
      alert('Deposit successful!')
    } catch (error: any) {
      console.error('Deposit failed:', error)
      alert(`Deposit failed: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      alert('Please enter a valid amount')
      return
    }

    if (!withdrawAddress) {
      alert('Please enter a destination address')
      return
    }

    try {
      await balanceAPI.withdraw(employerId, {
        amount: Number(withdrawAmount),
        destinationAddress: withdrawAddress,
        description: 'Manual withdrawal via dashboard'
      })
      setWithdrawAmount('')
      setWithdrawAddress('')
      setShowWithdrawForm(false)
      await loadData()
      alert('Withdrawal successful!')
    } catch (error: any) {
      console.error('Withdrawal failed:', error)
      alert(`Withdrawal failed: ${error.response?.data?.message || error.message}`)
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'payroll_deduction':
        return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-yellow-600" />
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600'
      case 'withdrawal':
      case 'payroll_deduction':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Loading balance...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!balance) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 h-5 w-5" />
                Virtual Balance
              </CardTitle>
              <CardDescription>Multi-employer custodial platform balance</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(balance.currentBalance)}</p>
              {balance.lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Updated {formatDate(balance.lastUpdated)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deposited</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {formatCurrency(balance.totalDeposited)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Withdrawn</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">
                {formatCurrency(balance.totalWithdrawn)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={() => setShowDepositForm(!showDepositForm)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>

          {/* Deposit Form */}
          {showDepositForm && (
            <div className="mt-4 p-4 border border-white/20 rounded-lg bg-white/10">
              <h4 className="font-semibold mb-3 text-white">Deposit Funds</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Amount (MNEE)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 bg-white/5 rounded-md text-white placeholder-gray-400"
                    placeholder="Enter amount"
                    step="0.00000001"
                    min="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDeposit}>Confirm Deposit</Button>
                  <Button variant="outline" onClick={() => setShowDepositForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Form */}
          {showWithdrawForm && (
            <div className="mt-4 p-4 border border-white/20 rounded-lg bg-white/10">
              <h4 className="font-semibold mb-3 text-white">Withdraw Funds</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Amount (MNEE)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 bg-white/5 rounded-md text-white placeholder-gray-400"
                    placeholder="Enter amount"
                    step="0.00000001"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Destination Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 bg-white/5 rounded-md font-mono text-sm text-white placeholder-gray-400"
                    placeholder="Enter Bitcoin address"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleWithdraw}>Confirm Withdrawal</Button>
                  <Button variant="outline" onClick={() => setShowWithdrawForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 10 balance transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border border-white/20 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionTypeIcon(tx.type)}
                    <div>
                      <p className="font-medium text-sm">
                        {tx.description || tx.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                      {tx.txHash && (
                        <p className="text-xs text-gray-400 font-mono">{tx.txHash.substring(0, 16)}...</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionTypeColor(tx.type)}`}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {formatCurrency(tx.balanceAfter)}
                    </p>
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
