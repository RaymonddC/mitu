'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { employeeAPI, type Employee } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatWalletAddress, formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

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
    walletAddress: '',
    salaryAmount: '',
    notes: ''
  })

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    if (employer) {
      loadEmployees()
    }
  }, [isConnected, employer])

  const loadEmployees = async () => {
    if (!employer) return

    try {
      const res = await employeeAPI.list(employer.id)
      setEmployees(res.data.data)
    } catch (error) {
      console.error('Failed to load employees:', error)
      toast({ title: 'Error', description: 'Failed to load employees' })
    } finally {
      setLoading(false)
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
          salaryAmount: parseFloat(formData.salaryAmount),
          notes: formData.notes || undefined
        })
        toast({ title: 'Success', description: 'Employee updated successfully' })
      } else {
        // Create new employee
        await employeeAPI.create({
          employerId: employer.id,
          name: formData.name,
          email: formData.email || undefined,
          walletAddress: formData.walletAddress,
          salaryAmount: parseFloat(formData.salaryAmount),
          notes: formData.notes || undefined
        })
        toast({ title: 'Success', description: 'Employee added successfully' })
      }

      setShowAddForm(false)
      setEditingId(null)
      setFormData({ name: '', email: '', walletAddress: '', salaryAmount: '', notes: '' })
      loadEmployees()
    } catch (error: any) {
      console.error('Failed to save employee:', error)
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save employee' })
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id)
    setFormData({
      name: employee.name,
      email: employee.email || '',
      walletAddress: employee.walletAddress,
      salaryAmount: employee.salaryAmount.toString(),
      notes: employee.notes || ''
    })
    setShowAddForm(true)
  }

  const handleCancelEdit = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({ name: '', email: '', walletAddress: '', salaryAmount: '', notes: '' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return

    try {
      await employeeAPI.delete(id)
      toast({ title: 'Success', description: 'Employee deactivated' })
      loadEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
      toast({ title: 'Error', description: 'Failed to deactivate employee' })
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Employees</h1>
        <p className="text-gray-600 text-lg">Manage your team members</p>
      </div>

      <div className="space-y-6">

      {/* Add/Edit Employee Form */}
      {showAddForm && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
            <CardDescription>{editingId ? 'Update employee details' : 'Enter employee details'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Wallet Address *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    className={`w-full rounded-md border px-3 py-2 font-mono text-sm ${editingId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    placeholder="0x..."
                  />
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">Wallet address cannot be changed</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Salary (MNEE) *</label>
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
              <div className="flex gap-3">
                <Button type="submit">
                  {editingId ? 'Update Employee' : 'Add Employee'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Members ({employees.length})</CardTitle>
              <CardDescription>Active employees on payroll</CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="relative bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:from-blue-500/30 hover:to-purple-500/30 hover:border-white/40 text-white font-semibold transition-all duration-300 hover:scale-105"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No employees yet. Add your first team member!
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-4 pt-2 px-2 font-semibold">Name</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Wallet Address</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Salary</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Status</th>
                    <th className="pb-4 pt-2 px-2 font-semibold">Added</th>
                    <th className="pb-4 pt-2 px-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-2">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          {employee.email && (
                            <div className="text-gray-500 text-xs">{employee.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-2 font-mono text-xs">
                        {formatWalletAddress(employee.walletAddress)}
                      </td>
                      <td className="py-5 px-2 font-medium">
                        {formatCurrency(Number(employee.salaryAmount))}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(employee.id, employee.name)}
                            title="Deactivate employee"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
