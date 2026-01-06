'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Budget {
  id: string;
  employerId: string;
  monthlyLimit: number;
  perEmployeeLimit?: number;
  startDate: string;
  endDate: string;
  usedThisMonth: number;
  lastResetAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BudgetManagementProps {
  employerId: string;
}

export function BudgetManagement({ employerId }: BudgetManagementProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [perEmployeeLimit, setPerEmployeeLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, [employerId]);

  const fetchBudgets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/budgets/${employerId}`);
      setBudgets(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch budgets', error);
    }
  };

  const handleCreateBudget = async () => {
    if (!monthlyLimit || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(monthlyLimit) <= 0) {
      alert('Monthly limit must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/wallet/budgets`, {
        employerId,
        monthlyLimit: parseFloat(monthlyLimit),
        perEmployeeLimit: perEmployeeLimit ? parseFloat(perEmployeeLimit) : undefined,
        startDate,
        endDate
      });

      alert('Pre-authorized budget created successfully!');

      // Reset form
      setMonthlyLimit('');
      setPerEmployeeLimit('');
      setStartDate('');
      setEndDate('');
      setShowCreateDialog(false);

      // Refresh budgets
      await fetchBudgets();
    } catch (error: any) {
      console.error('Failed to create budget', error);
      alert(error.response?.data?.message || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const activeBudget = budgets.find(b => b.isActive && new Date(b.endDate) >= new Date() && new Date(b.startDate) <= new Date());
  const remaining = activeBudget ? activeBudget.monthlyLimit - activeBudget.usedThisMonth : 0;
  const percentageUsed = activeBudget ? (activeBudget.usedThisMonth / activeBudget.monthlyLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Active Budget Summary */}
      {activeBudget && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Active Pre-Authorized Budget
                </CardTitle>
                <CardDescription>
                  Autonomous payroll up to {activeBudget.monthlyLimit.toLocaleString()} MNEE/month
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Used this month</span>
                <span className="font-semibold">{activeBudget.usedThisMonth.toLocaleString()} / {activeBudget.monthlyLimit.toLocaleString()} MNEE</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    percentageUsed > 90 ? 'bg-red-600' : percentageUsed > 70 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{percentageUsed.toFixed(1)}% used</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Remaining</p>
                <p className="text-lg font-bold text-blue-900">{remaining.toLocaleString()} MNEE</p>
              </div>
              <div className="bg-secondary border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">Per Employee Limit</p>
                <p className="text-lg font-bold text-foreground">
                  {activeBudget.perEmployeeLimit ? `${activeBudget.perEmployeeLimit.toLocaleString()} MNEE` : 'None'}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700 font-medium mb-1">Valid Until</p>
                <p className="text-sm font-bold text-green-900">
                  {new Date(activeBudget.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>How it works:</strong> Payroll amounts within this budget are automatically executed
                without requiring your wallet approval. Amounts exceeding the budget will require manual approval.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Budget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pre-Authorized Budgets</CardTitle>
              <CardDescription>
                Set spending limits for autonomous payroll execution
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create Pre-Authorized Budget</DialogTitle>
                  <DialogDescription className="text-base">
                    Set limits for autonomous payroll execution within your wallet
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Monthly Limit (MNEE) *
                    </label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(e.target.value)}
                      disabled={loading}
                      className="text-base h-11"
                    />
                    <p className="text-sm text-gray-600 mt-1.5">
                      Maximum MNEE that can be spent per month
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Per Employee Limit (MNEE) (Optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={perEmployeeLimit}
                      onChange={(e) => setPerEmployeeLimit(e.target.value)}
                      disabled={loading}
                      className="text-base h-11"
                    />
                    <p className="text-sm text-gray-600 mt-1.5">
                      Maximum payment per employee (leave empty for no limit)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={loading}
                      className="text-base h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      End Date *
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={loading}
                      className="text-base h-11"
                    />
                  </div>

                  <Button
                    onClick={handleCreateBudget}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11 text-base font-semibold"
                  >
                    {loading ? 'Creating...' : 'Create Budget'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No budgets created yet</p>
              <p className="text-xs mt-1">Create a budget to enable autonomous payroll</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const isActive = budget.isActive && new Date(budget.endDate) >= new Date() && new Date(budget.startDate) <= new Date();
                const isExpired = new Date(budget.endDate) < new Date();

                return (
                  <div
                    key={budget.id}
                    className={`border rounded-lg p-4 ${isActive ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold">{budget.monthlyLimit.toLocaleString()} MNEE/month</span>
                      </div>
                      {isActive ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Valid:</span>{' '}
                        {new Date(budget.startDate).toLocaleDateString()} -{' '}
                        {new Date(budget.endDate).toLocaleDateString()}
                      </div>
                      {budget.perEmployeeLimit && (
                        <div>
                          <span className="font-medium">Per Employee:</span> {budget.perEmployeeLimit.toLocaleString()} MNEE
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
