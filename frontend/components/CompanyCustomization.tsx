'use client';

import { useState } from 'react';
import { employerAPI, type Employer } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Edit, Save, X, Calendar, Mail, DollarSign } from 'lucide-react';

interface CompanyCustomizationProps {
  employer: Employer | null;
  onUpdate: () => void;
}

export function CompanyCustomization({ employer, onUpdate }: CompanyCustomizationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: employer?.companyName || '',
    email: employer?.email || '',
    payrollDay: employer?.payrollDay || 28,
    monthlyBudget: employer?.monthlyBudget ? Number(employer.monthlyBudget) : 0,
  });

  const handleEdit = () => {
    setFormData({
      companyName: employer?.companyName || '',
      email: employer?.email || '',
      payrollDay: employer?.payrollDay || 28,
      monthlyBudget: employer?.monthlyBudget ? Number(employer.monthlyBudget) : 0,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      companyName: employer?.companyName || '',
      email: employer?.email || '',
      payrollDay: employer?.payrollDay || 28,
      monthlyBudget: employer?.monthlyBudget ? Number(employer.monthlyBudget) : 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer) return;

    setSaving(true);
    try {
      await employerAPI.update(employer.id, {
        companyName: formData.companyName,
        email: formData.email || undefined,
        payrollDay: formData.payrollDay,
        monthlyBudget: formData.monthlyBudget > 0 ? formData.monthlyBudget : undefined,
      });

      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to update company:', error);
      alert(error.response?.data?.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  if (!employer) return null;

  return (
    <Card className="shadow-2xl bg-white backdrop-blur-2xl border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <CardTitle>Company Settings</CardTitle>
          </div>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
        <CardDescription>Manage your company information and payroll settings</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Company Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="company@example.com"
                />
              </div>

              {/* Payroll Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payroll Day (Day of Month) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="28"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  value={formData.payrollDay}
                  onChange={(e) => setFormData({ ...formData, payrollDay: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">Day of month when payroll is processed (1-28)</p>
              </div>

              {/* Monthly Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Monthly Budget (MNEE)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Optional spending cap for monthly payroll</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Company Name Display */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-lg p-4 border border-purple-100">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Company Name</label>
                <p className="text-lg font-semibold text-gray-900">{employer.companyName}</p>
              </div>

              {/* Email Display */}
              <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-lg p-4 border border-blue-100">
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Company Email
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {employer.email || <span className="text-gray-400 text-base">Not set</span>}
                </p>
              </div>

              {/* Payroll Day Display */}
              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-lg p-4 border border-green-100">
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payroll Day
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {employer.payrollDay}
                  <span className="text-sm font-normal text-gray-600"> of each month</span>
                </p>
              </div>

              {/* Monthly Budget Display */}
              <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-lg p-4 border border-amber-100">
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Monthly Budget
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {employer.monthlyBudget ? (
                    <>{Number(employer.monthlyBudget).toFixed(2)} MNEE</>
                  ) : (
                    <span className="text-gray-400 text-base">Not set</span>
                  )}
                </p>
              </div>
            </div>

            {/* Wallet Address (Read-only) */}
            <div className="bg-gradient-to-br from-gray-50/50 to-slate-50/50 rounded-lg p-4 border border-gray-200">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Wallet Address (Read-only)</label>
              <p className="text-sm font-mono text-gray-700 break-all bg-white px-3 py-2 rounded border border-gray-200">
                {employer.walletAddress}
              </p>
              <p className="text-xs text-gray-500 mt-2">This is your company's unique wallet identifier</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
