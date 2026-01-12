'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, PieChart, BarChart3 } from 'lucide-react';

interface PayrollAnalyticsProps {
  totalMonthlyPayroll: number;
  employeeCount: number;
  employees?: Array<{
    id: string;
    name: string;
    salaryAmount: number;
  }>;
}

export function PayrollAnalytics({ totalMonthlyPayroll, employeeCount, employees = [] }: PayrollAnalyticsProps) {
  // Calculate salary distribution
  const salaryRanges = [
    { label: '$0-$2k', min: 0, max: 2000, count: 0, color: 'bg-blue-500' },
    { label: '$2k-$5k', min: 2000, max: 5000, count: 0, color: 'bg-green-500' },
    { label: '$5k-$10k', min: 5000, max: 10000, count: 0, color: 'bg-yellow-500' },
    { label: '$10k+', min: 10000, max: Infinity, count: 0, color: 'bg-purple-500' },
  ];

  employees.forEach(emp => {
    const salary = Number(emp.salaryAmount);
    const range = salaryRanges.find(r => salary >= r.min && salary < r.max);
    if (range) range.count++;
  });

  const maxCount = Math.max(...salaryRanges.map(r => r.count), 1);

  // Get top earners
  const topEarners = [...employees]
    .sort((a, b) => Number(b.salaryAmount) - Number(a.salaryAmount))
    .slice(0, 5);

  // Calculate average salary
  const averageSalary = employeeCount > 0 ? totalMonthlyPayroll / employeeCount : 0;

  // Mock monthly spending data (last 6 months)
  const monthlyData = [
    { month: 'Jul', amount: totalMonthlyPayroll * 0.85 },
    { month: 'Aug', amount: totalMonthlyPayroll * 0.90 },
    { month: 'Sep', amount: totalMonthlyPayroll * 0.95 },
    { month: 'Oct', amount: totalMonthlyPayroll * 0.88 },
    { month: 'Nov', amount: totalMonthlyPayroll * 1.0 },
    { month: 'Dec', amount: totalMonthlyPayroll },
  ];

  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Spending Trend */}
      <Card className="shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Monthly Spending Trend</CardTitle>
          </div>
          <CardDescription className="text-gray-400">Payroll expenses over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-48 gap-2">
              {monthlyData.map((data, index) => {
                const height = (data.amount / maxAmount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all duration-500 hover:from-purple-700 hover:to-pink-600 cursor-pointer group relative"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/20">
                          ${(data.amount / 1000).toFixed(1)}k
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 font-medium">{data.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <span className="text-sm text-gray-300">Total (6 months)</span>
              <span className="text-lg font-bold text-white">
                ${((monthlyData.reduce((sum, d) => sum + d.amount, 0)) / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Distribution */}
      <Card className="shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Salary Distribution</CardTitle>
          </div>
          <CardDescription className="text-gray-400">Employee count by salary range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {salaryRanges.map((range, index) => {
              const percentage = maxCount > 0 ? (range.count / maxCount) * 100 : 0;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{range.label}</span>
                    <span className="text-gray-300">{range.count} employees</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${range.color} transition-all duration-700 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <span className="text-sm text-gray-300">Average Salary</span>
              <span className="text-lg font-bold text-white">
                ${(averageSalary / 1000).toFixed(1)}k/month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Earners */}
      <Card className="shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-400" />
            <CardTitle className="text-white">Top Earners</CardTitle>
          </div>
          <CardDescription className="text-gray-400">Highest paid employees</CardDescription>
        </CardHeader>
        <CardContent>
          {topEarners.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-500" />
              <p className="text-sm">No employees added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topEarners.map((emp, index) => {
                const percentage = totalMonthlyPayroll > 0 ? (Number(emp.salaryAmount) / totalMonthlyPayroll) * 100 : 0;
                return (
                  <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{emp.name}</p>
                      <p className="text-xs text-gray-300">{percentage.toFixed(1)}% of total payroll</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-300">${(Number(emp.salaryAmount) / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-gray-400">per month</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      <Card className="shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Payroll Summary</CardTitle>
          </div>
          <CardDescription className="text-gray-400">Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/40">
              <p className="text-sm text-purple-300 mb-1 font-medium">Total Employees</p>
              <p className="text-3xl font-bold text-white">{employeeCount}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/40">
              <p className="text-sm text-blue-300 mb-1 font-medium">Monthly Cost</p>
              <p className="text-3xl font-bold text-white">${(totalMonthlyPayroll / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/40">
              <p className="text-sm text-green-300 mb-1 font-medium">Average Salary</p>
              <p className="text-2xl font-bold text-white">${(averageSalary / 1000).toFixed(1)}k</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-4 border border-amber-400/40">
              <p className="text-sm text-amber-300 mb-1 font-medium">Annual Cost</p>
              <p className="text-2xl font-bold text-white">${((totalMonthlyPayroll * 12) / 1000).toFixed(0)}k</p>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${(employeeCount / (employeeCount + 10)) * 439.6} 439.6`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{employeeCount}</span>
                <span className="text-xs text-gray-300">Employees</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
