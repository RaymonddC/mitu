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

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    loadData();
  }, [isConnected, walletAddress]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to MNEE Payroll</h2>
          <p className="text-gray-600">Employer account not found. Please set up your profile.</p>
        </div>
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
