'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { employeeAPI, riskAPI, type Employee, type RiskScreeningResult } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatWalletAddress, formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, CheckCircle, XCircle, Upload, User, Shield, AlertTriangle, Info } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { RiskBadge, RiskIndicator } from '@/components/RiskBadge'
import { InfoTooltip } from '@/components/InfoTooltip'

export default function EmployeesPage() {
  const router = useRouter()
  const { employer, isConnected } = useStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: '',
    walletAddress: '',
    salaryAmount: '',
    notes: ''
  })
  const [walletRisk, setWalletRisk] = useState<RiskScreeningResult | null>(null)
  const [checkingRisk, setCheckingRisk] = useState(false)
  const [employeeRisks, setEmployeeRisks] = useState<Record<string, RiskScreeningResult>>({})
  const [loadingRisks, setLoadingRisks] = useState(false)

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
      loadEmployees()
    }
  }, [isConnected, employer, loading])

  const loadEmployees = async () => {
    if (!employer) return

    try {
      const res = await employeeAPI.list(employer.id)
      const employeeList = res.data.data
      setEmployees(employeeList)

      // Load risk status for all employees
      loadEmployeeRisks(employeeList)
    } catch (error) {
      console.error('Failed to load employees:', error)
      toast.error('Failed to Load Employees', 'Please refresh the page')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeRisks = async (employeeList: Employee[]) => {
    setLoadingRisks(true)
    const risks: Record<string, RiskScreeningResult> = {}

    for (const employee of employeeList) {
      try {
        const res = await riskAPI.screenWallet(employee.walletAddress)
        risks[employee.id] = res.data.data
      } catch (error) {
        console.error(`Failed to load risk for ${employee.name}:`, error)
      }
    }

    setEmployeeRisks(risks)
    setLoadingRisks(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image Too Large', 'Image size must be less than 2MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, profileImage: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleWalletAddressChange = async (address: string) => {
    setFormData({ ...formData, walletAddress: address })
    setWalletRisk(null)

    // Auto-check risk if valid Ethereum address
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setCheckingRisk(true)
      try {
        const res = await riskAPI.screenWallet(address)
        setWalletRisk(res.data.data)

        if (res.data.data.action === 'block') {
          toast.error('High Risk Wallet Detected', res.data.data.summary)
        } else if (res.data.data.action === 'warn') {
          toast.warning('Risky Wallet', res.data.data.summary)
        }
      } catch (error) {
        console.error('Risk check failed:', error)
      } finally {
        setCheckingRisk(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employer) return

    try {
      if (editingId) {
        // Update existing employee
        await employeeAPI.update(editingId, {
          name: formData.name,
          email: formData.email || undefined,
          profileImage: formData.profileImage || undefined,
          salaryAmount: parseFloat(formData.salaryAmount),
          notes: formData.notes || undefined
        })
        toast.success('Employee Updated', `${formData.name} was updated successfully`)

        // Update only this employee in the list
        setEmployees(employees.map(emp =>
          emp.id === editingId
            ? { ...emp,
                name: formData.name,
                email: formData.email || undefined,
                profileImage: formData.profileImage || undefined,
                salaryAmount: parseFloat(formData.salaryAmount),
                notes: formData.notes || undefined
              }
            : emp
        ))
      } else {
        // Create new employee
        await employeeAPI.create({
          employerId: employer.id,
          name: formData.name,
          email: formData.email || undefined,
          profileImage: formData.profileImage || undefined,
          walletAddress: formData.walletAddress,
          salaryAmount: parseFloat(formData.salaryAmount),
          notes: formData.notes || undefined
        })
        toast.success('Employee Added', `${formData.name} has been added to payroll`)

        // Reload all employees when adding new one
        loadEmployees()
      }

      setShowAddForm(false)
      setEditingId(null)
      setFormData({ name: '', email: '', profileImage: '', walletAddress: '', salaryAmount: '', notes: '' })
      setWalletRisk(null)
    } catch (error: any) {
      console.error('Failed to save employee:', error)
      toast.error('Failed to Save Employee', error.response?.data?.message || 'Please try again')
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id)
    setFormData({
      name: employee.name,
      email: employee.email || '',
      profileImage: employee.profileImage || '',
      walletAddress: employee.walletAddress,
      salaryAmount: employee.salaryAmount.toString(),
      notes: employee.notes || ''
    })
    setShowAddForm(true)
  }

  const handleCancelEdit = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({ name: '', email: '', profileImage: '', walletAddress: '', salaryAmount: '', notes: '' })
    setWalletRisk(null)
    setCheckingRisk(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return

    try {
      await employeeAPI.delete(id)
      toast.success('Employee Deactivated', 'Employee has been removed from active payroll')
      loadEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
      toast.error('Failed to Deactivate', 'Could not remove employee from payroll')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 flex items-center justify-center">
        <div className="text-lg text-gray-300">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Employees</h1>
          <p className="text-gray-300 text-lg">Manage your team members</p>
        </div>

        <div className="space-y-6">

        {/* Add/Edit Employee Form */}
        {showAddForm && (
          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">{editingId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
              <CardDescription className="text-gray-400">{editingId ? 'Update employee details' : 'Enter employee details'}</CardDescription>
            </CardHeader>
            <CardContent>
              {!editingId && (
                <div className="mb-6 p-4 bg-white/5 border border-white/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Automatic Security Screening</p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        When you enter a wallet address, we'll automatically check it against sanctions lists,
                        transaction patterns, and known scams to ensure safe payments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/20">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Employee photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-blue-300" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="px-3 py-1.5 bg-white/10 border border-white/20 text-blue-300 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-sm">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Photo
                    </div>
                  </label>
                  <p className="text-xs text-gray-400">Max 2MB</p>
                  {formData.profileImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profileImage: '' })}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2 text-white">
                    <span>Wallet Address *</span>
                    <InfoTooltip content="The Ethereum wallet address where salary will be sent. We automatically screen all wallets for sanctions, scams, and suspicious activity." />
                    {checkingRisk && (
                      <span className="flex items-center gap-1 text-xs text-blue-300">
                        <Shield className="h-4 w-4 animate-pulse" />
                        Checking security...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    className={`w-full rounded-md border px-3 py-2 font-mono text-sm transition-all ${
                      editingId
                        ? 'bg-white/5 border-white/10 cursor-not-allowed text-gray-400'
                        : walletRisk?.action === 'block'
                        ? 'border-red-400/50 bg-red-500/10 text-white'
                        : walletRisk?.action === 'warn'
                        ? 'border-yellow-400/50 bg-yellow-500/10 text-white'
                        : walletRisk?.action === 'proceed'
                        ? 'border-green-400/50 bg-green-500/10 text-white'
                        : 'border-white/20 bg-white/5 text-white'
                    } placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400`}
                    value={formData.walletAddress}
                    onChange={(e) => handleWalletAddressChange(e.target.value)}
                    placeholder="0x1234567890abcdef..."
                  />
                  {!editingId && !checkingRisk && !walletRisk && formData.walletAddress && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Enter a complete wallet address to check security
                    </p>
                  )}
                  {editingId && (
                    <p className="text-xs text-gray-400 mt-1">Wallet address cannot be changed for security reasons</p>
                  )}
                  {!editingId && checkingRisk && (
                    <div className="mt-3">
                      <RiskBadge riskLevel="loading" compact={false} />
                    </div>
                  )}
                  {!editingId && walletRisk && (
                    <div className="mt-3 space-y-2">
                      <RiskBadge
                        riskLevel={walletRisk.riskLevel}
                        riskScore={walletRisk.finalScore}
                        summary={walletRisk.summary}
                        action={walletRisk.action}
                        compact={false}
                        showDetails={true}
                      />
                      {walletRisk.action === 'block' && (
                        <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                          <p className="text-sm font-semibold text-red-300 mb-1">⚠️ Cannot Add Employee</p>
                          <p className="text-xs text-red-200">
                            This wallet has been flagged as high-risk and cannot receive payments.
                            Please use a different wallet address.
                          </p>
                        </div>
                      )}
                      {walletRisk.action === 'warn' && (
                        <div className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-300 mb-1">⚠️ Proceed with Caution</p>
                          <p className="text-xs text-yellow-200">
                            This wallet shows some risk indicators. You can add them, but payments will require extra review.
                          </p>
                        </div>
                      )}
                      {walletRisk.action === 'proceed' && (
                        <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                          <p className="text-sm font-semibold text-green-300 mb-1">✓ Wallet Verified</p>
                          <p className="text-xs text-green-200">
                            This wallet appears safe and can be added to your payroll.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2 text-white">
                    <span>Monthly Salary (MNEE) *</span>
                    <InfoTooltip content="The monthly salary amount in MNEE tokens. This will be automatically paid on your configured payroll day." />
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    value={formData.salaryAmount}
                    onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Notes</label>
                <textarea
                  className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 items-center">
                <Button
                  type="submit"
                  disabled={!editingId && walletRisk?.action === 'block'}
                  className={`bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white ${walletRisk?.action === 'block' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editingId ? 'Update Employee' : 'Add Employee'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  Cancel
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const employee = employees.find(e => e.id === editingId)
                      if (employee) {
                        handleDelete(editingId, employee.name)
                      }
                    }}
                    className="ml-auto bg-red-500/10 text-red-300 border-red-400/30 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Employee
                  </Button>
                )}
              </div>
              {!editingId && walletRisk?.action === 'block' && (
                <p className="text-xs text-red-300 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cannot add employee with high-risk wallet address
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

        {/* Employee List */}
        <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Team Members ({employees.length})</CardTitle>
                <CardDescription className="text-gray-400">Active employees on payroll with real-time risk monitoring</CardDescription>
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No employees yet. Add your first team member!
              </div>
            ) : (
              <>
                {/* Risk Status Info Banner */}
                <div className="mb-6 p-4 bg-white/5 border border-white/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-white">Automatic Security Monitoring</h3>
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-medium">Live</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed mb-3">
                        All employee wallets are automatically screened for sanctions, scams, and suspicious activity.
                        Hover over any risk status badge to see detailed security analysis.
                      </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-400/30">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-xs font-medium text-green-300">SAFE</span>
                        <span className="text-[10px] text-green-400">= No issues detected</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30">
                        <AlertTriangle className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-300">RISKY</span>
                        <span className="text-[10px] text-yellow-400">= Review recommended</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400/30">
                        <XCircle className="h-3 w-3 text-red-400" />
                        <span className="text-xs font-medium text-red-300">BLOCKED</span>
                        <span className="text-[10px] text-red-400">= Payment blocked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead className="border-b border-white/20">
                  <tr className="text-left text-sm text-gray-300">
                    <th className="pb-4 pt-2 px-2 font-semibold">Name</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Wallet Address</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Salary</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Risk Status</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Status</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Added</th>
                    <th className="pb-4 pt-2 px-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="text-sm hover:bg-white/5 transition-all duration-200">
                      <td className="py-5 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            {employee.profileImage ? (
                              <img
                                src={employee.profileImage}
                                alt={employee.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-blue-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{employee.name}</div>
                            {employee.email && (
                              <div className="text-gray-400 text-xs">{employee.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-2 font-mono text-xs text-gray-300">
                        {formatWalletAddress(employee.walletAddress)}
                      </td>
                      <td className="py-5 px-2 font-medium text-white">
                        {formatCurrency(Number(employee.salaryAmount))}
                      </td>
                      <td className="py-5 px-2 relative">
                        {loadingRisks ? (
                          <div className="flex items-center gap-2 text-blue-500">
                            <Shield className="h-4 w-4 animate-pulse" />
                            <span className="text-xs font-medium">Scanning...</span>
                          </div>
                        ) : employeeRisks[employee.id] ? (
                          <div className="group relative">
                            {/* Risk Badge with enhanced styling */}
                            {employeeRisks[employee.id].action === 'block' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all cursor-help">
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">BLOCKED</span>
                                <span className="text-[10px] font-mono bg-red-500/30 px-1.5 py-0.5 rounded">
                                  {employeeRisks[employee.id].finalScore}
                                </span>
                              </div>
                            ) : employeeRisks[employee.id].action === 'warn' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/30 transition-all cursor-help">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">RISKY</span>
                                <span className="text-[10px] font-mono bg-yellow-500/30 px-1.5 py-0.5 rounded">
                                  {employeeRisks[employee.id].finalScore}
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-all cursor-help">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">SAFE</span>
                                <span className="text-[10px] font-mono bg-green-500/30 px-1.5 py-0.5 rounded">
                                  {employeeRisks[employee.id].finalScore}
                                </span>
                              </div>
                            )}

                            {/* Simplified Tooltip - Shows Above */}
                            <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-800 border-2 border-white/20 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-white">
                                    {employeeRisks[employee.id].riskLevel.toUpperCase()} RISK
                                  </span>
                                  <span className={`text-sm font-bold ${
                                    employeeRisks[employee.id].action === 'block' ? 'text-red-400' :
                                    employeeRisks[employee.id].action === 'warn' ? 'text-yellow-400' :
                                    'text-green-400'
                                  }`}>
                                    Score: {employeeRisks[employee.id].finalScore}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                  {employeeRisks[employee.id].summary}
                                </p>
                              </div>
                              {/* Tooltip arrow pointing down */}
                              <div className="absolute left-4 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-gray-400">
                            <Info className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Not screened</span>
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-2">
                        {employee.active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-400/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300 border border-gray-400/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-2 text-gray-400">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="py-5 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(employee)}
                            title="Edit employee"
                            className="hover:bg-blue-500/20 hover:text-blue-300 text-gray-300 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(employee.id, employee.name)}
                            title="Deactivate employee"
                            className="hover:bg-red-500/20 text-red-400 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 hover:scale-110 transition-transform" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
      </div>
    </div>
  )
}
