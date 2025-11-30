'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { employerAPI, employeeAPI, alertAPI, type Alert } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getSeverityColor } from '@/lib/utils';
import { Users, DollarSign, Calendar, AlertCircle, PlayCircle } from 'lucide-react';
import { BalanceDashboard } from '@/components/BalanceDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { walletAddress, isConnected, employer, setEmployer } = useStore();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [payrollDay, setPayrollDay] = useState(28);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Redirect to home if wallet disconnected
    if (!isConnected || !walletAddress) {
      router.push('/');
      return;
    }

    // Load dashboard data
    loadData();
  }, [isConnected, walletAddress, router]);

  const loadData = async () => {
    if (!walletAddress) return;

    try {
      // Load employer data
      const empRes = await employerAPI.get(walletAddress);
      setEmployer(empRes.data.data);

      // Load alerts
      const alertRes = await alertAPI.list(empRes.data.data.id, { resolved: false });
      setAlerts(alertRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmployer = async () => {
    if (!walletAddress || !companyName.trim()) return;

    setRegistering(true);
    try {
      const response = await employerAPI.create({
        walletAddress,
        companyName: companyName.trim(),
        payrollDay,
      });

      setEmployer(response.data.data);
      setShowOnboarding(false);
    } catch (error: any) {
      console.error('Failed to register employer:', error);
      alert(error.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!employer && !showOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Welcome to MNEE Payroll!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your wallet is connected. Let's set up your employer account to start managing payroll.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Connected Wallet</p>
                  <p className="font-mono text-xs">{walletAddress}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Wallet Connected</p>
                  <p className="text-sm text-gray-600">Ready to create your employer profile</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Set Up Company</p>
                  <p className="text-sm text-gray-600">Provide your company details</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Add Employees</p>
                  <p className="text-sm text-gray-600">Start building your team</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employer && showOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Create Employer Profile</CardTitle>
            <CardDescription>
              Set up your company details to start managing payroll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <input
                type="text"
                placeholder="e.g., Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={registering}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payroll Day of Month</label>
              <select
                value={payrollDay}
                onChange={(e) => setPayrollDay(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={registering}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                When should employees receive their monthly salary?
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2"><strong>Your Wallet:</strong></p>
              <p className="text-xs font-mono text-gray-600 break-all">{walletAddress}</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowOnboarding(false)}
                variant="outline"
                className="flex-1"
                disabled={registering}
              >
                Back
              </Button>
              <Button
                onClick={handleRegisterEmployer}
                disabled={!companyName.trim() || registering}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {registering ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMonthlyPayroll = employer.totalMonthlyPayroll || 0;
  const employeeCount = employer.employees?.length || 0;
  const nextPayday = new Date();
  nextPayday.setDate(employer.payrollDay);
  if (nextPayday < new Date()) {
    nextPayday.setMonth(nextPayday.getMonth() + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {employer.companyName}</p>
      </div>

      {/* Virtual Balance Dashboard */}
      <BalanceDashboard employerId={employer.id} />

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeeCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalMonthlyPayroll)}</div>
            <p className="text-xs text-gray-500 mt-1">Total monthly cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Next Payday</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nextPayday.getDate()}</div>
            <p className="text-xs text-gray-500 mt-1">{formatDate(nextPayday)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your payroll</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => router.push('/employees')}>
            <Users className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
          <Button onClick={() => router.push('/payroll')} variant="outline">
            <PlayCircle className="mr-2 h-4 w-4" />
            Run Payroll
          </Button>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Alerts & Recommendations
            </CardTitle>
            <CardDescription>AI agent suggestions and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>{alert.severity}</span>
                      <h4 className="font-semibold">{alert.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(alert.createdAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await alertAPI.resolve(alert.id);
                      loadData();
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
