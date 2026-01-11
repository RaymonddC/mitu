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
    return <div className="flex justify-center py-12">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Employees</h1>
        <p className="text-gray-600 text-lg">Manage your team members</p>
      </div>

      <div className="space-y-6">

      {/* Add/Edit Employee Form */}
      {showAddForm && (
        <Card className="shadow-2xl bg-white backdrop-blur-2xl border border-gray-200">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
            <CardDescription>{editingId ? 'Update employee details' : 'Enter employee details'}</CardDescription>
          </CardHeader>
          <CardContent>
            {!editingId && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Automatic Security Screening</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      When you enter a wallet address, we'll automatically check it against sanctions lists,
                      transaction patterns, and known scams to ensure safe payments.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-200">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Employee photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-blue-400" />
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
                    <div className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2 text-sm">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Photo
                    </div>
                  </label>
                  <p className="text-xs text-gray-500">Max 2MB</p>
                  {formData.profileImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profileImage: '' })}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <span>Wallet Address *</span>
                    <InfoTooltip content="The Ethereum wallet address where salary will be sent. We automatically screen all wallets for sanctions, scams, and suspicious activity." />
                    {checkingRisk && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
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
                        ? 'bg-gray-100 cursor-not-allowed'
                        : walletRisk?.action === 'block'
                        ? 'border-red-300 bg-red-50'
                        : walletRisk?.action === 'warn'
                        ? 'border-yellow-300 bg-yellow-50'
                        : walletRisk?.action === 'proceed'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300'
                    }`}
                    value={formData.walletAddress}
                    onChange={(e) => handleWalletAddressChange(e.target.value)}
                    placeholder="0x1234567890abcdef..."
                  />
                  {!editingId && !checkingRisk && !walletRisk && formData.walletAddress && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Enter a complete wallet address to check security
                    </p>
                  )}
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">Wallet address cannot be changed for security reasons</p>
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
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Cannot Add Employee</p>
                          <p className="text-xs text-red-700">
                            This wallet has been flagged as high-risk and cannot receive payments.
                            Please use a different wallet address.
                          </p>
                        </div>
                      )}
                      {walletRisk.action === 'warn' && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Proceed with Caution</p>
                          <p className="text-xs text-yellow-700">
                            This wallet shows some risk indicators. You can add them, but payments will require extra review.
                          </p>
                        </div>
                      )}
                      {walletRisk.action === 'proceed' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 mb-1">✓ Wallet Verified</p>
                          <p className="text-xs text-green-700">
                            This wallet appears safe and can be added to your payroll.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <span>Monthly Salary (MNEE) *</span>
                    <InfoTooltip content="The monthly salary amount in MNEE tokens. This will be automatically paid on your configured payroll day." />
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.salaryAmount}
                    onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 items-center">
                <Button
                  type="submit"
                  disabled={!editingId && walletRisk?.action === 'block'}
                  className={walletRisk?.action === 'block' ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {editingId ? 'Update Employee' : 'Add Employee'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
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
                    className="ml-auto bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Employee
                  </Button>
                )}
              </div>
              {!editingId && walletRisk?.action === 'block' && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cannot add employee with high-risk wallet address
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card className="shadow-2xl bg-white backdrop-blur-2xl border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Members ({employees.length})</CardTitle>
              <CardDescription>Active employees on payroll with real-time risk monitoring</CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="relative z-10 overflow-hidden bg-white/20 backdrop-blur-2xl border-2 border-white/40 shadow-[0_8px_32px_0_rgba(255,255,255,0.18)] hover:shadow-[0_8px_40px_0_rgba(255,255,255,0.25)] hover:bg-white/30 hover:border-white/50 text-gray-900 font-bold tracking-wide transition-all duration-300 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/40 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
            >
              <Plus className="mr-2 h-5 w-5 relative z-10" />
              <span className="relative z-10">Add Employee</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No employees yet. Add your first team member!
            </div>
          ) : (
            <>
              {/* Risk Status Info Banner */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-blue-900">Automatic Security Monitoring</h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Live</span>
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed mb-3">
                      All employee wallets are automatically screened for sanctions, scams, and suspicious activity.
                      Hover over any risk status badge to see detailed security analysis.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">SAFE</span>
                        <span className="text-[10px] text-green-600">= No issues detected</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">RISKY</span>
                        <span className="text-[10px] text-yellow-600">= Review recommended</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span className="text-xs font-medium text-red-700">BLOCKED</span>
                        <span className="text-[10px] text-red-600">= Payment blocked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-4 pt-2 px-2 font-semibold">Name</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Wallet Address</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Salary</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Risk Status</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Status</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Added</th>
                    <th className="pb-4 pt-2 px-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="text-sm hover:bg-blue-50/30 transition-all duration-200 hover:shadow-sm">
                      <td className="py-5 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                            {employee.profileImage ? (
                              <img
                                src={employee.profileImage}
                                alt={employee.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            {employee.email && (
                              <div className="text-gray-500 text-xs">{employee.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-2 font-mono text-xs">
                        {formatWalletAddress(employee.walletAddress)}
                      </td>
                      <td className="py-5 px-2 font-medium">
                        {formatCurrency(Number(employee.salaryAmount))}
                      </td>
                      <td className="py-5 px-2">
                        {loadingRisks ? (
                          <div className="flex items-center gap-2 text-blue-500">
                            <Shield className="h-4 w-4 animate-pulse" />
                            <span className="text-xs font-medium">Scanning...</span>
                          </div>
                        ) : employeeRisks[employee.id] ? (
                          <div className="group relative">
                            {/* Risk Badge with enhanced styling */}
                            {employeeRisks[employee.id].action === 'block' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all cursor-help">
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">BLOCKED</span>
                                <span className="text-[10px] font-mono bg-red-100 px-1.5 py-0.5 rounded">
                                  {employeeRisks[employee.id].finalScore}
                                </span>
                              </div>
                            ) : employeeRisks[employee.id].action === 'warn' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 transition-all cursor-help">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">RISKY</span>
                                <span className="text-[10px] font-mono bg-yellow-100 px-1.5 py-0.5 rounded">
                                  {employeeRisks[employee.id].finalScore}
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-all cursor-help">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">SAFE</span>
                                <span className="text-[10px] font-mono bg-green-100 px-1.5 py-0.5 rounded">
                                  {employeeRisks[employee.id].finalScore}
                                </span>
                              </div>
                            )}

                            {/* Simplified Tooltip - Shows Above */}
                            <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border-2 border-gray-200 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-700">
                                    {employeeRisks[employee.id].riskLevel.toUpperCase()} RISK
                                  </span>
                                  <span className={`text-sm font-bold ${
                                    employeeRisks[employee.id].action === 'block' ? 'text-red-600' :
                                    employeeRisks[employee.id].action === 'warn' ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    Score: {employeeRisks[employee.id].finalScore}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {employeeRisks[employee.id].summary}
                                </p>
                              </div>
                              {/* Tooltip arrow pointing down */}
                              <div className="absolute left-4 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500">
                            <Info className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Not screened</span>
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-2">
                        {employee.active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-2 text-gray-500">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="py-5 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(employee)}
                            title="Edit employee"
                            className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(employee.id, employee.name)}
                            title="Deactivate employee"
                            className="hover:bg-red-50 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 hover:scale-110 transition-transform" />
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
  )
}
