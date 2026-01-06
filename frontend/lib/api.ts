/**
 * API Client
 * Handles all backend API calls
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Employer {
  id: string;
  walletAddress: string;
  companyName: string;
  email?: string;
  payrollDay: number;
  monthlyBudget?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  employees?: Employee[];
  totalMonthlyPayroll?: number;
  profileImage?: string;
}

export interface Employee {
  id: string;
  employerId: string;
  name: string;
  email?: string;
  profileImage?: string;
  walletAddress: string;
  salaryAmount: number;
  paymentCycle: string;
  customPayDay?: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollLog {
  id: string;
  employerId: string;
  employeeId: string;
  amount: number;
  txHash?: string;
  status: string;
  failureReason?: string;
  idempotencyKey: string;
  executedAt: string;
  confirmedAt?: string;
  retryCount: number;
  metadata?: any;
  employee?: {
    name: string;
    walletAddress: string;
  };
}

export interface Alert {
  id: string;
  employerId: string;
  severity: string;
  category: string;
  title: string;
  message: string;
  resolved: boolean;
  metadata?: any;
  createdAt: string;
  resolvedAt?: string;
}

export interface BalanceTransaction {
  id: string;
  employerId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  txHash?: string;
  referenceId?: string;
  metadata?: any;
  createdAt: string;
}

export interface BalanceInfo {
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  lastUpdated?: string;
}

export interface PlatformStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalPayrollPaid: number;
  totalEmployers: number;
  totalEmployees: number;
  platformBalance: number;
  lastUpdated: string;
}

// Employer API
export const employerAPI = {
  list: () => api.get<{ data: Employer[] }>('/employers'),
  create: (data: Partial<Employer>) => api.post('/employers', data),
  get: (walletAddress: string) => api.get<{ data: Employer }>(`/employers/${walletAddress}`),
  update: (id: string, data: Partial<Employer>) => api.put(`/employers/${id}`, data),
};

// Employee API
export const employeeAPI = {
  create: (data: Partial<Employee>) => api.post('/employees', data),
  list: (employerId: string) => api.get<{ data: Employee[] }>(`/employees?employerId=${employerId}`),
  get: (id: string) => api.get<{ data: Employee }>(`/employees/${id}`),
  update: (id: string, data: Partial<Employee>) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

// Payroll API
export const payrollAPI = {
  run: (data: { employerId: string; employeeIds?: string[]; testMode?: boolean; useWalletSigning?: boolean }) => api.post('/payroll/run', data),
  history: (employerId: string) => api.get<{ data: PayrollLog[] }>(`/payroll/history?employerId=${employerId}`),
  get: (logId: string) => api.get<{ data: PayrollLog }>(`/payroll/${logId}`),
  retry: (logId: string) => api.post(`/payroll/${logId}/retry`),
};

// Alert API
export const alertAPI = {
  list: (employerId: string, params?: { severity?: string; resolved?: boolean }) => {
    const query = new URLSearchParams({
      employerId,
      ...(params?.severity && { severity: params.severity }),
      ...(params?.resolved !== undefined && { resolved: String(params.resolved) }),
    });
    return api.get<{ data: Alert[] }>(`/alerts?${query}`);
  },
  resolve: (id: string) => api.put(`/alerts/${id}/resolve`),
};

// Balance API (Week 1: Virtual balance system)
export const balanceAPI = {
  deposit: (employerId: string, data: { amount: number; txHash?: string; description?: string }) => api.post(`/balance/employers/${employerId}/deposit`, data),
  withdraw: (employerId: string, data: { amount: number; destinationAddress: string; description?: string }) => api.post(`/balance/employers/${employerId}/withdraw`, data),
  getBalance: (employerId: string) => api.get<{ data: BalanceInfo }>(`/balance/employers/${employerId}/balance`),
  getTransactionHistory: (employerId: string, params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams({
      ...(params?.limit && { limit: String(params.limit) }),
      ...(params?.offset && { offset: String(params.offset) }),
    });
    return api.get<{ data: { transactions: BalanceTransaction[]; pagination: any } }>(`/balance/employers/${employerId}/transactions?${query}`);
  },
  getPlatformStats: () => api.get<{ data: PlatformStats }>('/balance/platform/stats'),
};

// Wallet Signing API (Week 2: Non-custodial wallet signing)
export const walletSigningAPI = {
  createApproval: (data: { employerId: string; employees: any[] }) => api.post('/wallet/approvals/create', data),
  getApproval: (approvalId: string) => api.get(`/wallet/approvals/${approvalId}`),
  listApprovals: (employerId: string, status?: string) => api.get(`/wallet/approvals?employerId=${employerId}${status ? `&status=${status}` : ''}`),
  submitSignedTransaction: (approvalId: string, data: { txHash: string }) => api.post(`/wallet/approvals/${approvalId}/submit`, data),
  rejectApproval: (approvalId: string, reason?: string) => api.post(`/wallet/approvals/${approvalId}/reject`, { reason }),
  createBudget: (data: { employerId: string; monthlyLimit: number; startDate: string; endDate: string; perEmployeeLimit?: number }) => api.post('/wallet/budgets', data),
  getEmployerBudgets: (employerId: string) => api.get(`/wallet/budgets/${employerId}`),
  checkBudgetAuthorization: (employerId: string, amount: number) => api.post(`/wallet/budgets/${employerId}/check`, { amount }),
};

export default api;
