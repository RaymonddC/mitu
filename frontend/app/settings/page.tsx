'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { employerAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { employer, setEmployer, isConnected } = useStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    payrollDay: 28,
    monthlyBudget: ''
  })

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    if (employer) {
      setFormData({
        companyName: employer.companyName,
        email: employer.email || '',
        payrollDay: employer.payrollDay,
        monthlyBudget: employer.monthlyBudget ? String(employer.monthlyBudget) : ''
      })
    }
  }, [isConnected, employer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employer) return

    setLoading(true)

    try {
      await employerAPI.update(employer.id, {
        companyName: formData.companyName,
        email: formData.email || undefined,
        payrollDay: formData.payrollDay,
        monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : undefined
      })

      // Refresh employer data
      const res = await employerAPI.get(employer.walletAddress)
      setEmployer(res.data.data)

      toast({ title: 'Success', description: 'Settings updated successfully' })
    } catch (error: any) {
      console.error('Failed to update settings:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update settings'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!employer) {
    return <div className="flex justify-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>Update your company information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for notifications and alerts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address</label>
              <input
                type="text"
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
                value={employer.walletAddress}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your connected wallet (cannot be changed)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Default Payday *</label>
                <select
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.payrollDay}
                  onChange={(e) => setFormData({ ...formData, payrollDay: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Day {day} of month
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  When to run automatic payroll each month
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monthly Budget (MNEE)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                  placeholder="Optional"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum monthly payroll amount
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MNEE Network Configuration</CardTitle>
          <CardDescription>Connected network details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">RPC Endpoint</div>
            <div className="font-mono text-sm mt-1">
              {process.env.NEXT_PUBLIC_MNEE_RPC_URL}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Chain ID</div>
            <div className="font-mono text-sm mt-1">
              {process.env.NEXT_PUBLIC_MNEE_CHAIN_ID}
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <strong>Network:</strong> You are connected to MNEE Testnet. All transactions use test tokens.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
