'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { employerAPI, type Employer } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, ArrowRight, Calendar, Search } from 'lucide-react';
import { formatOrdinal } from '@/lib/utils';

export default function SelectCompanyPage() {
  const router = useRouter();
  const { walletAddress, isConnected, setEmployer } = useStore();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Employer[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Employer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [companyName, setCompanyName] = useState('GM Corp');
  const [payrollDay, setPayrollDay] = useState(28);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      router.push('/');
      return;
    }

    loadCompanies();
  }, [isConnected, walletAddress, router]);

  const loadCompanies = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      // Get all companies from database
      const response = await employerAPI.list();

      if (response.data.data && response.data.data.length > 0) {
        // Filter to only show companies owned by connected wallet
        const myCompanies = response.data.data.filter(
          company => company.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );

        if (myCompanies.length > 0) {
          setCompanies(myCompanies);
          setFilteredCompanies(myCompanies);
          setShowCreateForm(false);
        } else {
          // No companies for this wallet - show create form
          setCompanies([]);
          setFilteredCompanies([]);
          setShowCreateForm(true);
        }
      } else {
        // No companies exist - show create form
        setCompanies([]);
        setFilteredCompanies([]);
        setShowCreateForm(true);
      }
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      // If error, show create form
      setCompanies([]);
      setFilteredCompanies([]);
      setShowCreateForm(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const handleSelectCompany = (company: Employer) => {
    setEmployer(company);
    router.push('/dashboard');
  };

  const handleCreateCompany = async () => {
    if (!walletAddress || !companyName.trim()) return;

    setCreating(true);
    try {
      const response = await employerAPI.create({
        walletAddress,
        companyName: companyName.trim(),
        payrollDay,
      });

      setEmployer(response.data.data);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to create company:', error);
      alert(error.response?.data?.message || 'Failed to create company. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Select Company</h1>
        <p className="text-gray-600 text-lg">Choose a company to manage or create a new one</p>
      </div>

      <div className="space-y-6">
        {/* Existing Companies */}
        {companies.length > 0 && !showCreateForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Companies ({companies.length})
              </h2>
            </div>

            {/* Search Bar */}
            {companies.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies by name or wallet address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  className="shadow-2xl bg-white backdrop-blur-2xl border border-gray-200 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
                  onClick={() => handleSelectCompany(company)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                          {company.profileImage ? (
                            <img
                              src={company.profileImage}
                              alt={company.companyName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{company.companyName}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {company.employees?.length || 0} employees
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Monthly Payroll</span>
                        <span className="font-semibold text-gray-900">
                          ${(company.totalMonthlyPayroll || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Payroll Day
                        </span>
                        <span className="font-semibold text-gray-900">
                          {company.payrollDay}th of month
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create New Button */}
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="w-full border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 h-16"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Company
            </Button>
          </div>
        )}

        {/* Create Company Form */}
        {(showCreateForm || companies.length === 0) && (
          <Card className="shadow-2xl bg-white backdrop-blur-2xl border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-purple-600" />
                {companies.length > 0 ? 'Create New Company' : 'Create Your First Company'}
              </CardTitle>
              <CardDescription>
                {companies.length > 0
                  ? 'Set up a new company profile to manage payroll'
                  : 'Get started by setting up your company details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g., GM Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={creating}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Payroll Day of Month
                </label>
                <p className="text-xs text-gray-500 -mt-1">
                  Select the day when employees receive their monthly salary
                </p>

                {/* Calendar Grid for Day Selection */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-5 shadow-sm">
                  {/* Info Banner */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <span className="font-semibold">Safe for all months:</span> Days 1-28 are available in every month.
                      Avoid 29-31 as some months (February, April, June, September, November) don't have these days.
                    </p>
                  </div>

                  {/* Days 1-14 */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Early Month (1-14)</div>
                    <div className="grid grid-cols-7 gap-2 p-3 bg-white/50 rounded-lg border border-purple-200/50">
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => {
                        const isSelected = payrollDay === day;
                        const isPopular = [1, 15].includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setPayrollDay(day)}
                            disabled={creating}
                            className={`
                              relative h-10 rounded-lg font-medium text-sm transition-all
                              ${isSelected
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105 ring-2 ring-purple-400'
                                : isPopular
                                  ? 'bg-white text-purple-700 border-2 border-purple-400 hover:border-purple-600 hover:bg-purple-50 shadow-sm'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                              }
                              ${creating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {day}
                            {isPopular && !isSelected && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Days 15-28 */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2 px-1">Mid to Late Month (15-28)</div>
                    <div className="grid grid-cols-7 gap-2 p-3 bg-white/50 rounded-lg border border-purple-200/50">
                      {Array.from({ length: 14 }, (_, i) => i + 15).map((day) => {
                        const isSelected = payrollDay === day;
                        const isPopular = [15, 28].includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setPayrollDay(day)}
                            disabled={creating}
                            className={`
                              relative h-10 rounded-lg font-medium text-sm transition-all
                              ${isSelected
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105 ring-2 ring-purple-400'
                                : isPopular
                                  ? 'bg-white text-purple-700 border-2 border-purple-400 hover:border-purple-600 hover:bg-purple-50 shadow-sm'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                              }
                              ${creating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {day}
                            {isPopular && !isSelected && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Display */}
                  <div className="mt-5 pt-4 border-t-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-medium">Selected Day:</span>
                      <span className="text-lg font-bold text-purple-700">
                        {formatOrdinal(payrollDay)} of each month
                      </span>
                    </div>
                    {[1, 15, 28].includes(payrollDay) && (
                      <p className="text-xs text-purple-600 mt-2 flex items-center gap-1.5 bg-purple-100/50 px-2 py-1.5 rounded">
                        <span className="inline-block h-2 w-2 rounded-full bg-purple-500"></span>
                        Popular choice - commonly used by many companies
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2"><strong>Connected Wallet:</strong></p>
                <p className="text-xs font-mono text-gray-600 break-all">{walletAddress}</p>
              </div>

              <div className="flex gap-3">
                {companies.length > 0 && (
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleCreateCompany}
                  disabled={!companyName.trim() || creating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {creating ? 'Creating...' : 'Create Company'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
