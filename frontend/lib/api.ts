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
}

export interface Employee {
  id: string;
  employerId: string;
  name: string;
  email?: string;
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

// Employer API
export const employerAPI = {
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
  run: (data: { employerId: string; employeeIds?: string[]; testMode?: boolean }) =>
    api.post('/payroll/run', data),
  history: (employerId: string) =>
    api.get<{ data: PayrollLog[] }>(`/payroll/history?employerId=${employerId}`),
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

export default api;
