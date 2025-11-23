# MNEE Autonomous Payroll - 2-Week Development Roadmap

**Version:** 1.0
**Timeline:** 14 days (2 weeks for development + 2 weeks buffer for hackathon)
**Goal:** Build production-ready multi-tenant autonomous payroll platform with wallet signing foundation

---

## 📋 Table of Contents

- [Executive Summary](#executive-summary)
- [Week 1: Multi-Employer Custodial Platform](#week-1-multi-employer-custodial-platform)
- [Week 2: Wallet Signing Foundation](#week-2-wallet-signing-foundation)
- [Option 4 Deep Dive: Non-Custodial Wallet Signing](#option-4-deep-dive-non-custodial-wallet-signing)
- [Architecture Comparison](#architecture-comparison)
- [Demo Strategy](#demo-strategy)
- [Risk Mitigation](#risk-mitigation)
- [Success Metrics](#success-metrics)

---

## 🎯 Executive Summary

### Strategic Approach: Hybrid Development

We're building in two phases to maximize both **demo impact** and **production readiness**:

1. **Week 1 (Days 1-7):** Multi-employer custodial platform with virtual balances
   - **Goal:** Working, scalable platform for hackathon demo
   - **Architecture:** Platform holds funds, tracks virtual balances
   - **Result:** Fully autonomous, impressive multi-tenant system

2. **Week 2 (Days 8-14):** Wallet signing foundation (non-custodial)
   - **Goal:** Production-ready security model
   - **Architecture:** Employers keep custody, sign transactions
   - **Result:** Prototype showing security-first approach

### Why This Approach?

| Benefit | Week 1 (Custodial) | Week 2 (Non-Custodial) |
|---------|-------------------|------------------------|
| **Demo-Ready** | ✅ Fully working | ⚠️ Prototype only |
| **Autonomous** | ✅ Zero intervention | ⚠️ Needs approval |
| **Scalable** | ✅ Multi-tenant | ✅ Multi-tenant |
| **Production Security** | ⚠️ Custodial risk | ✅ Secure |
| **Impressive to Judges** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Combined:** You get a working demo PLUS show you understand production requirements.

---

## 📅 Week 1: Multi-Employer Custodial Platform

### Overview

Build a multi-tenant SaaS platform where:
- Multiple companies can register and use the system
- Platform operates a single master wallet (custodial)
- Each employer has a virtual balance tracked in database
- Fully autonomous payroll execution
- Platform pays employees on behalf of employers

### Day 1-2: Core Virtual Balance System

#### Database Schema Changes

**File:** `backend/prisma/schema.prisma`

```prisma
model Employer {
  id                String       @id @default(uuid())
  walletAddress     String       @unique
  companyName       String
  monthlyBudget     Decimal
  payrollDay        Int
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // NEW: Virtual balance fields
  virtualBalance    Decimal      @default(0)          // Current MNEE balance
  totalDeposited    Decimal      @default(0)          // Lifetime deposits
  totalWithdrawn    Decimal      @default(0)          // Lifetime withdrawals
  depositAddress    String?      @unique              // Unique deposit address (optional)
  balanceUpdatedAt  DateTime?                         // Last balance change

  employees         Employee[]
  payrollLogs       PayrollLog[]
  alerts            Alert[]
  transactions      BalanceTransaction[]
}

// NEW: Transaction ledger for balance changes
model BalanceTransaction {
  id                String       @id @default(uuid())
  employerId        String
  employer          Employer     @relation(fields: [employerId], references: [id], onDelete: Cascade)

  type              String       // 'deposit', 'withdrawal', 'payroll_deduction', 'refund'
  amount            Decimal      // Amount of change (positive or negative)
  balanceBefore     Decimal      // Balance before transaction
  balanceAfter      Decimal      // Balance after transaction

  description       String?      // Human-readable description
  txHash            String?      // Blockchain transaction hash (for deposits/withdrawals)
  referenceId       String?      // Reference to PayrollLog or other entity

  metadata          Json?        // Additional data
  createdAt         DateTime     @default(now())

  @@index([employerId, createdAt])
  @@index([type])
}

// NEW: Platform-wide statistics
model PlatformStats {
  id                String       @id @default("platform")
  totalDeposits     Decimal      @default(0)
  totalWithdrawals  Decimal      @default(0)
  totalPayrollPaid  Decimal      @default(0)
  totalEmployers    Int          @default(0)
  totalEmployees    Int          @default(0)
  updatedAt         DateTime     @updatedAt
}
```

#### Migration Script

**File:** `backend/prisma/migrations/XXX_add_virtual_balance/migration.sql`

```sql
-- Add virtual balance fields to Employer
ALTER TABLE "Employer" ADD COLUMN "virtualBalance" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Employer" ADD COLUMN "totalDeposited" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Employer" ADD COLUMN "totalWithdrawn" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Employer" ADD COLUMN "depositAddress" TEXT;
ALTER TABLE "Employer" ADD COLUMN "balanceUpdatedAt" TIMESTAMP(3);

-- Create unique index on depositAddress
CREATE UNIQUE INDEX "Employer_depositAddress_key" ON "Employer"("depositAddress");

-- Create BalanceTransaction table
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceBefore" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "txHash" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "BalanceTransaction_employerId_createdAt_idx" ON "BalanceTransaction"("employerId", "createdAt");
CREATE INDEX "BalanceTransaction_type_idx" ON "BalanceTransaction"("type");

-- Add foreign key
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create PlatformStats table
CREATE TABLE "PlatformStats" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "totalDeposits" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPayrollPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalEmployers" INTEGER NOT NULL DEFAULT 0,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformStats_pkey" PRIMARY KEY ("id")
);

-- Initialize platform stats
INSERT INTO "PlatformStats" ("id", "updatedAt") VALUES ('platform', CURRENT_TIMESTAMP);
```

#### Backend Services

**File:** `backend/src/services/balanceService.ts`

```typescript
import { prisma } from '../config/database';
import { logger } from '../middleware/logger';
import { Decimal } from '@prisma/client/runtime/library';

export class BalanceService {
  /**
   * Add funds to employer's virtual balance (deposit)
   */
  async deposit(
    employerId: string,
    amount: number,
    txHash?: string,
    description?: string
  ): Promise<{ newBalance: number; transaction: any }> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      if (amount <= 0) {
        throw new Error('Deposit amount must be positive');
      }

      const balanceBefore = Number(employer.virtualBalance);
      const balanceAfter = balanceBefore + amount;

      // Create transaction in database (atomic)
      const result = await prisma.$transaction(async (tx) => {
        // Update employer balance
        const updatedEmployer = await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            totalDeposited: { increment: amount },
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        const transaction = await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'deposit',
            amount,
            balanceBefore,
            balanceAfter,
            description: description || `Deposit of ${amount} MNEE`,
            txHash,
            metadata: {
              source: 'manual_deposit',
              timestamp: new Date().toISOString()
            }
          }
        });

        // Update platform stats
        await tx.platformStats.update({
          where: { id: 'platform' },
          data: {
            totalDeposits: { increment: amount }
          }
        });

        return { updatedEmployer, transaction };
      });

      logger.info('Deposit successful', {
        employerId,
        amount,
        newBalance: balanceAfter,
        txHash
      });

      return {
        newBalance: balanceAfter,
        transaction: result.transaction
      };
    } catch (error: any) {
      logger.error('Deposit failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Withdraw funds from employer's virtual balance
   */
  async withdraw(
    employerId: string,
    amount: number,
    destinationAddress: string,
    description?: string
  ): Promise<{ newBalance: number; txHash: string }> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      if (amount <= 0) {
        throw new Error('Withdrawal amount must be positive');
      }

      const balanceBefore = Number(employer.virtualBalance);

      if (balanceBefore < amount) {
        throw new Error(`Insufficient balance. Available: ${balanceBefore} MNEE`);
      }

      const balanceAfter = balanceBefore - amount;

      // Execute blockchain withdrawal (from platform wallet to employer)
      // TODO: Implement actual MNEE transfer
      const txHash = `withdrawal_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Update database
      const result = await prisma.$transaction(async (tx) => {
        // Update employer balance
        await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            totalWithdrawn: { increment: amount },
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        const transaction = await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'withdrawal',
            amount: -amount, // Negative for withdrawals
            balanceBefore,
            balanceAfter,
            description: description || `Withdrawal of ${amount} MNEE to ${destinationAddress}`,
            txHash,
            metadata: {
              destinationAddress,
              source: 'manual_withdrawal',
              timestamp: new Date().toISOString()
            }
          }
        });

        // Update platform stats
        await tx.platformStats.update({
          where: { id: 'platform' },
          data: {
            totalWithdrawals: { increment: amount }
          }
        });

        return transaction;
      });

      logger.info('Withdrawal successful', {
        employerId,
        amount,
        newBalance: balanceAfter,
        txHash
      });

      return {
        newBalance: balanceAfter,
        txHash
      };
    } catch (error: any) {
      logger.error('Withdrawal failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Deduct payroll from virtual balance
   */
  async deductPayroll(
    employerId: string,
    amount: number,
    payrollLogId: string
  ): Promise<number> {
    try {
      const employer = await prisma.employer.findUnique({
        where: { id: employerId }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      const balanceBefore = Number(employer.virtualBalance);

      if (balanceBefore < amount) {
        throw new Error(
          `Insufficient virtual balance for payroll. Required: ${amount} MNEE, Available: ${balanceBefore} MNEE`
        );
      }

      const balanceAfter = balanceBefore - amount;

      // Update database
      await prisma.$transaction(async (tx) => {
        // Update employer balance
        await tx.employer.update({
          where: { id: employerId },
          data: {
            virtualBalance: balanceAfter,
            balanceUpdatedAt: new Date()
          }
        });

        // Record transaction
        await tx.balanceTransaction.create({
          data: {
            employerId,
            type: 'payroll_deduction',
            amount: -amount, // Negative for deductions
            balanceBefore,
            balanceAfter,
            description: `Payroll payment deduction`,
            referenceId: payrollLogId,
            metadata: {
              source: 'autonomous_payroll',
              timestamp: new Date().toISOString()
            }
          }
        });

        // Update platform stats
        await tx.platformStats.update({
          where: { id: 'platform' },
          data: {
            totalPayrollPaid: { increment: amount }
          }
        });
      });

      logger.info('Payroll deducted from virtual balance', {
        employerId,
        amount,
        newBalance: balanceAfter,
        payrollLogId
      });

      return balanceAfter;
    } catch (error: any) {
      logger.error('Payroll deduction failed', {
        error: error.message,
        employerId,
        amount
      });
      throw error;
    }
  }

  /**
   * Get balance history
   */
  async getTransactionHistory(
    employerId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const transactions = await prisma.balanceTransaction.findMany({
        where: { employerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.balanceTransaction.count({
        where: { employerId }
      });

      return {
        transactions,
        total,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Failed to get transaction history', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      const stats = await prisma.platformStats.findUnique({
        where: { id: 'platform' }
      });

      const employerCount = await prisma.employer.count();
      const employeeCount = await prisma.employee.count();

      return {
        ...stats,
        totalEmployers: employerCount,
        totalEmployees: employeeCount
      };
    } catch (error: any) {
      logger.error('Failed to get platform stats', { error: error.message });
      throw error;
    }
  }
}

export const balanceService = new BalanceService();
```

#### API Endpoints

**File:** `backend/src/routes/balanceRoutes.ts`

```typescript
import { Router } from 'express';
import { balanceController } from '../controllers/balanceController';

const router = Router();

// Deposit funds to virtual balance
router.post('/employers/:employerId/deposit', balanceController.deposit);

// Withdraw funds from virtual balance
router.post('/employers/:employerId/withdraw', balanceController.withdraw);

// Get current balance
router.get('/employers/:employerId/balance', balanceController.getBalance);

// Get transaction history
router.get('/employers/:employerId/transactions', balanceController.getTransactionHistory);

// Get platform statistics (admin only)
router.get('/platform/stats', balanceController.getPlatformStats);

export default router;
```

**File:** `backend/src/controllers/balanceController.ts`

```typescript
import { Request, Response } from 'express';
import { balanceService } from '../services/balanceService';
import { logger } from '../middleware/logger';
import { prisma } from '../config/database';

export class BalanceController {
  /**
   * Deposit funds to employer's virtual balance
   * POST /api/balance/employers/:employerId/deposit
   */
  async deposit(req: Request, res: Response) {
    try {
      const { employerId } = req.params;
      const { amount, txHash, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be a positive number'
        });
      }

      const result = await balanceService.deposit(
        employerId,
        Number(amount),
        txHash,
        description
      );

      res.json({
        success: true,
        data: {
          newBalance: result.newBalance,
          transaction: result.transaction
        },
        message: `Successfully deposited ${amount} MNEE`
      });
    } catch (error: any) {
      logger.error('Deposit endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Deposit failed',
        message: error.message
      });
    }
  }

  /**
   * Withdraw funds from employer's virtual balance
   * POST /api/balance/employers/:employerId/withdraw
   */
  async withdraw(req: Request, res: Response) {
    try {
      const { employerId } = req.params;
      const { amount, destinationAddress, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be a positive number'
        });
      }

      if (!destinationAddress) {
        return res.status(400).json({
          error: 'Missing destination address',
          message: 'Destination wallet address is required'
        });
      }

      const result = await balanceService.withdraw(
        employerId,
        Number(amount),
        destinationAddress,
        description
      );

      res.json({
        success: true,
        data: {
          newBalance: result.newBalance,
          txHash: result.txHash
        },
        message: `Successfully withdrew ${amount} MNEE`
      });
    } catch (error: any) {
      logger.error('Withdrawal endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Withdrawal failed',
        message: error.message
      });
    }
  }

  /**
   * Get current balance
   * GET /api/balance/employers/:employerId/balance
   */
  async getBalance(req: Request, res: Response) {
    try {
      const { employerId } = req.params;

      const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        select: {
          virtualBalance: true,
          totalDeposited: true,
          totalWithdrawn: true,
          balanceUpdatedAt: true
        }
      });

      if (!employer) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Employer not found'
        });
      }

      res.json({
        success: true,
        data: {
          virtualBalance: Number(employer.virtualBalance),
          totalDeposited: Number(employer.totalDeposited),
          totalWithdrawn: Number(employer.totalWithdrawn),
          balanceUpdatedAt: employer.balanceUpdatedAt
        }
      });
    } catch (error: any) {
      logger.error('Get balance endpoint error', { error: error.message });
      res.status(500).json({
        error: 'Failed to get balance',
        message: error.message
      });
    }
  }

  /**
   * Get transaction history
   * GET /api/balance/employers/:employerId/transactions
   */
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { employerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await balanceService.getTransactionHistory(
        employerId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get transaction history error', { error: error.message });
      res.status(500).json({
        error: 'Failed to get transaction history',
        message: error.message
      });
    }
  }

  /**
   * Get platform statistics
   * GET /api/balance/platform/stats
   */
  async getPlatformStats(req: Request, res: Response) {
    try {
      const stats = await balanceService.getPlatformStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get platform stats error', { error: error.message });
      res.status(500).json({
        error: 'Failed to get platform stats',
        message: error.message
      });
    }
  }
}

export const balanceController = new BalanceController();
```

#### Update Payroll Controller

**File:** `backend/src/controllers/payrollController.ts` (modifications)

Add virtual balance check before executing payroll:

```typescript
// At the beginning of runPayroll function, after fetching employer:

// Check virtual balance
const totalSalaryAmount = employer.employees.reduce(
  (sum, emp) => sum + Number(emp.salaryAmount),
  0
);

if (Number(employer.virtualBalance) < totalSalaryAmount) {
  logger.error('Insufficient virtual balance for payroll', {
    employerId: employer.id,
    required: totalSalaryAmount,
    available: Number(employer.virtualBalance)
  });

  return res.status(400).json({
    error: 'Insufficient Balance',
    message: `Virtual balance (${employer.virtualBalance} MNEE) is insufficient for payroll (${totalSalaryAmount} MNEE required)`
  });
}

// ... continue with existing payroll logic

// After successful payroll, deduct from virtual balance:
await balanceService.deductPayroll(employer.id, totalSalaryAmount, payrollLog.id);
```

### Day 3-4: Frontend Integration

#### Balance Dashboard Component

**File:** `frontend/components/BalanceDashboard.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp } from 'lucide-react';

interface BalanceData {
  virtualBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  balanceUpdatedAt: string | null;
}

export function BalanceDashboard({ employerId }: { employerId: string }) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBalance();
  }, [employerId]);

  const fetchBalance = async () => {
    try {
      const response = await api.get(`/balance/employers/${employerId}/balance`);
      setBalance(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load balance',
        variant: 'destructive'
      });
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/balance/employers/${employerId}/deposit`, {
        amount: parseFloat(depositAmount),
        description: 'Manual deposit via dashboard'
      });

      toast({
        title: 'Success',
        description: `Deposited ${depositAmount} MNEE successfully`
      });

      setDepositAmount('');
      fetchBalance();
    } catch (error: any) {
      toast({
        title: 'Deposit Failed',
        description: error.response?.data?.message || 'Failed to deposit funds',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive'
      });
      return;
    }

    if (!withdrawAddress) {
      toast({
        title: 'Missing Address',
        description: 'Please enter a destination wallet address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/balance/employers/${employerId}/withdraw`, {
        amount: parseFloat(withdrawAmount),
        destinationAddress: withdrawAddress,
        description: 'Manual withdrawal via dashboard'
      });

      toast({
        title: 'Success',
        description: `Withdrew ${withdrawAmount} MNEE successfully`
      });

      setWithdrawAmount('');
      setWithdrawAddress('');
      fetchBalance();
    } catch (error: any) {
      toast({
        title: 'Withdrawal Failed',
        description: error.response?.data?.message || 'Failed to withdraw funds',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!balance) {
    return <div>Loading balance...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Virtual Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Virtual Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{balance.virtualBalance.toLocaleString()} MNEE</div>
          <p className="text-xs text-muted-foreground">
            Available for payroll
          </p>
          <div className="mt-4 flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit MNEE</DialogTitle>
                  <DialogDescription>
                    Add funds to your virtual balance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount (MNEE)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleDeposit} disabled={loading} className="w-full">
                    {loading ? 'Processing...' : 'Deposit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw MNEE</DialogTitle>
                  <DialogDescription>
                    Withdraw funds from your virtual balance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount (MNEE)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Destination Address</label>
                    <Input
                      placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleWithdraw} disabled={loading} className="w-full">
                    {loading ? 'Processing...' : 'Withdraw'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Total Deposited */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{balance.totalDeposited.toLocaleString()} MNEE</div>
          <p className="text-xs text-muted-foreground">
            Lifetime deposits
          </p>
        </CardContent>
      </Card>

      {/* Total Withdrawn */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{balance.totalWithdrawn.toLocaleString()} MNEE</div>
          <p className="text-xs text-muted-foreground">
            Lifetime withdrawals
          </p>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {balance.balanceUpdatedAt
              ? new Date(balance.balanceUpdatedAt).toLocaleString()
              : 'Never'}
          </div>
          <p className="text-xs text-muted-foreground">
            Balance last changed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Day 5-7: Testing & Polish

**Testing Checklist:**

- [ ] Create 3 test employers with different balances
- [ ] Test deposit functionality
- [ ] Test withdrawal functionality
- [ ] Test payroll with sufficient balance
- [ ] Test payroll with insufficient balance
- [ ] Test concurrent payrolls for multiple employers
- [ ] Test transaction history pagination
- [ ] Test platform statistics
- [ ] UI/UX improvements
- [ ] Error handling edge cases
- [ ] Performance testing

---

## 📅 Week 2: Wallet Signing Foundation

### Overview

Build the foundation for non-custodial wallet signing where employers keep control of their funds and sign transactions themselves.

### Day 8-10: Research & Core Implementation

#### Step 1: Research MNEE Wallet Ecosystem

**Questions to answer:**
1. Does MNEE have a browser extension wallet?
2. Does MNEE have a mobile wallet with deep linking support?
3. What wallet APIs are available?
4. Can we integrate with existing BSV wallets?

**Resources:**
- MNEE Developer Documentation
- BSV wallet standards (HandCash, Money Button, etc.)
- 1Sat Ordinals wallet implementations

#### Step 2: Database Schema for Approvals

**File:** `backend/prisma/schema.prisma`

```prisma
// Pending transaction approvals
model PayrollApproval {
  id                String       @id @default(uuid())
  employerId        String
  employer          Employer     @relation(fields: [employerId], references: [id], onDelete: Cascade)

  status            String       // 'pending', 'approved', 'rejected', 'expired'
  unsignedTx        String       @db.Text  // Raw unsigned transaction hex
  signedTx          String?      @db.Text  // Signed transaction (after approval)

  // Transaction details
  totalAmount       Decimal                // Total MNEE being sent
  recipientCount    Int                    // Number of employees
  recipients        Json                   // Array of {address, amount, name}

  // Timing
  createdAt         DateTime     @default(now())
  expiresAt         DateTime                // Unsigned TX expires after 15 minutes
  approvedAt        DateTime?
  broadcastedAt     DateTime?

  // Transaction result
  txHash            String?                 // After broadcasting
  ticketId          String?                 // MNEE SDK ticket ID

  // Metadata
  description       String?
  metadata          Json?

  @@index([employerId, status])
  @@index([status, expiresAt])
}

// Pre-authorized payroll budgets
model PayrollBudget {
  id                String       @id @default(uuid())
  employerId        String
  employer          Employer     @relation(fields: [employerId], references: [id], onDelete: Cascade)

  // Budget limits
  monthlyLimit      Decimal                // Max amount per month
  perEmployeeLimit  Decimal?               // Max per employee (optional)

  // Validity period
  startDate         DateTime
  endDate           DateTime

  // Tracking
  usedThisMonth     Decimal      @default(0)
  lastResetAt       DateTime     @default(now())

  // Status
  isActive          Boolean      @default(true)

  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@index([employerId, isActive])
}
```

#### Step 3: Unsigned Transaction Service

**File:** `backend/src/services/walletSigningService.ts`

```typescript
import { prisma } from '../config/database';
import { logger } from '../middleware/logger';
import Mnee from '@mnee/ts-sdk';

export class WalletSigningService {
  private mnee: any;

  constructor() {
    if (process.env.MNEE_API_KEY && process.env.MNEE_API_KEY !== 'your-mnee-api-key-here') {
      this.mnee = new Mnee({
        environment: (process.env.MNEE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
        apiKey: process.env.MNEE_API_KEY
      });
    }
  }

  /**
   * Create unsigned transaction for payroll
   */
  async createUnsignedPayrollTx(
    employerId: string,
    employees: Array<{ id: string; name: string; walletAddress: string; salaryAmount: number }>
  ) {
    try {
      if (!this.mnee) {
        throw new Error('MNEE SDK not initialized - API key required');
      }

      // Prepare recipients
      const recipients = employees.map(emp => ({
        address: emp.walletAddress,
        amount: emp.salaryAmount
      }));

      const totalAmount = employees.reduce((sum, emp) => sum + emp.salaryAmount, 0);

      // Create unsigned transaction (broadcast: false)
      // Note: This requires a WIF key still, but we won't broadcast
      // In production, you'd use a different method that doesn't require WIF
      // For now, we'll use a placeholder approach

      logger.info('Creating unsigned payroll transaction', {
        employerId,
        recipientCount: recipients.length,
        totalAmount
      });

      // Store approval request in database
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const approval = await prisma.payrollApproval.create({
        data: {
          employerId,
          status: 'pending',
          unsignedTx: 'placeholder_unsigned_tx_hex', // TODO: Get from MNEE SDK
          totalAmount,
          recipientCount: recipients.length,
          recipients: employees.map(emp => ({
            employeeId: emp.id,
            name: emp.name,
            address: emp.walletAddress,
            amount: emp.salaryAmount
          })),
          expiresAt,
          description: `Monthly payroll for ${employees.length} employees`
        }
      });

      return {
        approvalId: approval.id,
        unsignedTx: approval.unsignedTx,
        totalAmount,
        recipientCount: recipients.length,
        recipients: employees,
        expiresAt
      };
    } catch (error: any) {
      logger.error('Failed to create unsigned transaction', {
        error: error.message,
        employerId
      });
      throw error;
    }
  }

  /**
   * Submit signed transaction from wallet
   */
  async submitSignedTransaction(approvalId: string, signedTx: string) {
    try {
      const approval = await prisma.payrollApproval.findUnique({
        where: { id: approvalId }
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== 'pending') {
        throw new Error(`Approval already ${approval.status}`);
      }

      if (new Date() > approval.expiresAt) {
        await prisma.payrollApproval.update({
          where: { id: approvalId },
          data: { status: 'expired' }
        });
        throw new Error('Approval expired - please create a new transaction');
      }

      // Broadcast signed transaction
      // TODO: Implement actual broadcast using MNEE SDK
      const txHash = `signed_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Update approval
      await prisma.payrollApproval.update({
        where: { id: approvalId },
        data: {
          status: 'approved',
          signedTx,
          txHash,
          approvedAt: new Date(),
          broadcastedAt: new Date()
        }
      });

      logger.info('Signed transaction broadcasted', {
        approvalId,
        txHash
      });

      return {
        approvalId,
        txHash,
        status: 'approved'
      };
    } catch (error: any) {
      logger.error('Failed to submit signed transaction', {
        error: error.message,
        approvalId
      });
      throw error;
    }
  }

  /**
   * Check if payroll is within pre-approved budget
   */
  async checkBudgetAuthorization(employerId: string, amount: number): Promise<boolean> {
    try {
      const budget = await prisma.payrollBudget.findFirst({
        where: {
          employerId,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      if (!budget) {
        return false; // No active budget
      }

      // Check if we're in a new month - reset if so
      const now = new Date();
      const lastReset = new Date(budget.lastResetAt);
      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        await prisma.payrollBudget.update({
          where: { id: budget.id },
          data: {
            usedThisMonth: 0,
            lastResetAt: now
          }
        });
      }

      // Check if amount is within remaining budget
      const remaining = Number(budget.monthlyLimit) - Number(budget.usedThisMonth);
      return amount <= remaining;
    } catch (error: any) {
      logger.error('Budget authorization check failed', {
        error: error.message,
        employerId,
        amount
      });
      return false;
    }
  }
}

export const walletSigningService = new WalletSigningService();
```

### Day 11-12: Frontend Wallet Integration

**File:** `frontend/components/WalletApproval.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PendingApproval {
  id: string;
  totalAmount: number;
  recipientCount: number;
  recipients: Array<{ name: string; amount: number }>;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export function WalletApproval({ employerId }: { employerId: string }) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingApprovals();
  }, [employerId]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get(`/wallet/approvals?employerId=${employerId}&status=pending`);
      setApprovals(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch approvals', error);
    }
  };

  const handleApprove = async (approvalId: string) => {
    setLoading(true);
    try {
      // Check if MNEE wallet extension is available
      if (!(window as any).mnee) {
        toast({
          title: 'Wallet Not Found',
          description: 'Please install MNEE wallet extension',
          variant: 'destructive'
        });
        return;
      }

      const wallet = (window as any).mnee;

      // Get unsigned transaction
      const txResponse = await api.get(`/wallet/approvals/${approvalId}`);
      const unsignedTx = txResponse.data.data.unsignedTx;

      // Request signature from wallet
      const signedTx = await wallet.signTransaction({
        rawtx: unsignedTx,
        description: `Payroll payment for ${txResponse.data.data.recipientCount} employees`
      });

      // Submit signed transaction
      await api.post(`/wallet/approvals/${approvalId}/submit`, {
        signedTx
      });

      toast({
        title: 'Success',
        description: 'Payroll transaction approved and broadcasted'
      });

      fetchPendingApprovals();
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.response?.data?.message || 'Failed to approve transaction',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await api.post(`/wallet/approvals/${approvalId}/reject`);
      toast({
        title: 'Rejected',
        description: 'Payroll transaction rejected'
      });
      fetchPendingApprovals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reject transaction',
        variant: 'destructive'
      });
    }
  };

  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>No pending transactions to approve</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => {
        const isExpired = new Date(approval.expiresAt) < new Date();
        const minutesRemaining = Math.max(
          0,
          Math.floor((new Date(approval.expiresAt).getTime() - Date.now()) / 60000)
        );

        return (
          <Card key={approval.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payroll Approval Required</CardTitle>
                {isExpired ? (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Expired
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {minutesRemaining} min remaining
                  </Badge>
                )}
              </div>
              <CardDescription>
                Created {new Date(approval.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="font-bold">{approval.totalAmount.toLocaleString()} MNEE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recipients:</span>
                  <span>{approval.recipientCount} employees</span>
                </div>

                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-medium mb-2">Employees:</p>
                  <ul className="text-sm space-y-1">
                    {approval.recipients.map((recipient, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{recipient.name}</span>
                        <span className="font-mono">{recipient.amount} MNEE</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(approval.id)}
                    disabled={loading || isExpired}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {loading ? 'Processing...' : 'Approve with Wallet'}
                  </Button>
                  <Button
                    onClick={() => handleReject(approval.id)}
                    variant="outline"
                    disabled={loading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>

                {isExpired && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    Transaction expired. A new approval request will be created.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

### Day 13-14: Testing & Documentation

**Testing:**
- [ ] Create unsigned transactions
- [ ] Test wallet signing flow (if extension available)
- [ ] Test transaction expiry
- [ ] Test budget authorization
- [ ] Integration testing with Week 1 features

**Documentation:**
- [ ] Update README with wallet signing instructions
- [ ] Document API endpoints
- [ ] Create demo video script
- [ ] Write pitch deck content

---

## 🎯 Option 4 Deep Dive: Non-Custodial Wallet Signing

### What is Non-Custodial Wallet Signing?

**Definition:** A security model where users maintain full control of their private keys and explicitly approve each transaction through their own wallet software.

**vs Custodial:** Platform never has access to user's private keys

### Why It Matters

#### Security Benefits
1. **No Single Point of Failure**: Platform breach doesn't compromise user funds
2. **User Control**: Users can revoke access anytime
3. **Transparency**: Every transaction requires explicit user consent
4. **Regulatory Compliance**: Platform isn't a custodian, avoiding money transmitter regulations

#### Trust Model
```
Custodial (Week 1):
User → Trusts Platform → Platform holds keys → Platform executes

Non-Custodial (Week 2):
User → Keeps keys → Platform creates unsigned TX → User signs → Broadcast
```

### How It Works: Technical Flow

#### Step 1: Transaction Creation
```typescript
// Backend creates unsigned transaction
const recipients = [
  { address: 'employee1_wallet', amount: 3000 },
  { address: 'employee2_wallet', amount: 2500 }
];

// MNEE SDK creates unsigned transaction
const unsignedTx = await mnee.transfer(recipients, null, {
  broadcast: false  // Don't broadcast, just create
});

// Returns: { rawtx: "0100000001..." }
```

#### Step 2: Store in Database
```typescript
await prisma.payrollApproval.create({
  employerId: 'abc123',
  unsignedTx: unsignedTx.rawtx,
  totalAmount: 5500,
  recipientCount: 2,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
  status: 'pending'
});
```

#### Step 3: Notify User
```typescript
// Push notification, email, or in-app notification
"You have 1 pending payroll approval (5,500 MNEE)"
```

#### Step 4: User Reviews in Frontend
```typescript
// Frontend shows transaction details
<TransactionPreview>
  Total: 5,500 MNEE
  Recipients: 2 employees
  - Alice: 3,000 MNEE
  - Bob: 2,500 MNEE
  Fee: ~0.01 MNEE
  [Approve] [Reject]
</TransactionPreview>
```

#### Step 5: Wallet Extension Signs
```typescript
// Frontend calls wallet extension
const mneeWallet = window.mnee; // Injected by browser extension

// Request signature
const signedTx = await mneeWallet.signTransaction({
  rawtx: unsignedTx,
  description: "Monthly payroll for 2 employees",
  amount: 5500
});

// Wallet shows popup:
// ┌─────────────────────────┐
// │ MNEE Wallet             │
// │ Sign Transaction?       │
// │                         │
// │ Amount: 5,500 MNEE      │
// │ Fee: 0.01 MNEE          │
// │                         │
// │ [Cancel] [Sign]         │
// └─────────────────────────┘
```

#### Step 6: Submit Signed Transaction
```typescript
// Frontend sends to backend
await api.post('/wallet/approvals/abc123/submit', {
  signedTx: signedTx
});

// Backend broadcasts to blockchain
const result = await mnee.broadcastTransaction(signedTx);

// Update database
await prisma.payrollApproval.update({
  where: { id: 'abc123' },
  data: {
    status: 'approved',
    signedTx: signedTx,
    txHash: result.txHash,
    approvedAt: new Date()
  }
});
```

#### Step 7: Confirmation
```typescript
// User sees confirmation
"✅ Payroll approved! TX: abc123def456..."

// Employees receive funds
// Agent updates PayrollLog records
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    EMPLOYER'S DEVICE                     │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  Your Web App  │         │  MNEE Wallet     │       │
│  │  (Frontend)    │◄────────┤  Extension       │       │
│  │                │  Inject │                  │       │
│  └────────────────┘  API    └──────────────────┘       │
│         │                              │                │
│         │ 1. Request                   │                │
│         │    Signature                 │                │
│         │─────────────────────────────►│                │
│         │                              │                │
│         │                         2. User              │
│         │                            Reviews           │
│         │                            Clicks            │
│         │                            "Sign"            │
│         │                              │                │
│         │◄─────────────────────────────│                │
│         │ 3. Signed TX                 │                │
│         │                              │                │
└─────────┼──────────────────────────────┼────────────────┘
          │                              │
          │ 4. Submit                    │ Private key
          │    Signed TX                 │ NEVER leaves
          ▼                              │ user's device
┌─────────────────────────────────────────┼────────────────┐
│            YOUR BACKEND                 │                │
│  ┌──────────────────────────────┐      │                │
│  │ 1. Create Unsigned TX        │      │                │
│  │ 2. Store in DB (pending)     │      │                │
│  │ 3. Wait for signature        │      │                │
│  │ 4. Receive signed TX         │      │                │
│  │ 5. Broadcast to blockchain   │      │                │
│  └──────────────────────────────┘      │                │
│                 │                       │                │
└─────────────────┼───────────────────────┴────────────────┘
                  │ 5. Broadcast
                  ▼
┌──────────────────────────────────────────────────────────┐
│               MNEE BLOCKCHAIN (BSV)                      │
│  - Validates signed transaction                          │
│  - Executes transfers                                    │
│  - Confirms in block                                     │
└──────────────────────────────────────────────────────────┘
```

### Autonomous vs Semi-Autonomous

#### Fully Autonomous (Custodial - Week 1)
```
Day 28, 00:00 UTC
  ↓
Agent: "It's payday for Company A"
  ↓
Agent: Signs with platform key
  ↓
Agent: Broadcasts transaction
  ↓
Done! (0 human interaction)
```

**Pros:**
- ✅ Zero manual work
- ✅ Runs while employer sleeps
- ✅ Perfect reliability

**Cons:**
- ❌ Platform holds keys (security risk)
- ❌ Trust required

---

#### Semi-Autonomous (Non-Custodial - Week 2)
```
Day 28, 00:00 UTC
  ↓
Agent: "It's payday for Company A"
  ↓
Agent: Creates unsigned transaction
  ↓
Agent: Notifies employer
  ↓
Employer wakes up, checks phone
  ↓
Employer: Reviews transaction
  ↓
Employer: Clicks "Approve"
  ↓
Wallet: Signs transaction
  ↓
Backend: Broadcasts
  ↓
Done! (1 manual approval step)
```

**Pros:**
- ✅ Employer keeps control
- ✅ Maximum security
- ✅ Regulatory safe

**Cons:**
- ❌ Requires employer to be available
- ❌ One manual step

---

### Hybrid Solution: Pre-Authorized Budgets

**Best of both worlds:**

```typescript
// Employer pre-approves monthly budget
await prisma.payrollBudget.create({
  employerId: 'abc123',
  monthlyLimit: 50000,        // Max 50k MNEE/month
  perEmployeeLimit: 10000,    // Max 10k per employee
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});
```

**Execution Logic:**
```typescript
// Day 28, 00:00 UTC - Agent runs
const totalPayroll = 45000; // Current month's payroll

// Check if within pre-approved budget
const withinBudget = await walletSigningService.checkBudgetAuthorization(
  employerId,
  totalPayroll
);

if (withinBudget) {
  // Execute automatically (no approval needed)
  await executePayroll();
} else {
  // Requires manual approval
  await createApprovalRequest();
}
```

**Result:**
- ✅ Fully autonomous for normal payrolls
- ✅ Manual approval only for exceptions (new employees, raises, etc.)
- ✅ Employer maintains control via budget limits

---

### 🔐 CRITICAL: Pre-Approved Budgets DO NOT Store Private Keys

**Important Security Clarification:**

Pre-authorized budgets are **metadata only** - they do NOT require storing employer WIF keys!

#### ❌ Common Misconception

```typescript
// WRONG ASSUMPTION:
"If payroll is automated within budget,
 we must store the employer's private key"

❌ NO! This is NOT how it works!
```

#### ✅ How It Actually Works (Three Secure Methods)

**Method 1: Budget Record + Wallet Auto-Approve Rules**

```typescript
// YOUR DATABASE (stores budget limit only)
await prisma.payrollBudget.create({
  employerId: 'abc123',
  monthlyLimit: 50000,        // ✅ Just a number
  perEmployeeLimit: 10000     // ✅ Just a number
  // ❌ NO PRIVATE KEY STORED!
});

// EMPLOYER'S WALLET EXTENSION (stores private key)
// Wallet has auto-approve rules configured by employer:
const walletSettings = {
  autoApproveRules: [
    {
      app: 'PayrollApp',
      maxAmount: 50000,
      frequency: 'monthly',
      action: 'auto-sign'  // Auto-sign without popup
    }
  ]
};

// When payroll transaction arrives at wallet:
if (tx.amount < 50000 && tx.app === 'PayrollApp') {
  // Wallet auto-signs using employer's key (stored in wallet)
  wallet.signTransaction(tx);
} else {
  // Show manual approval popup
  wallet.showApprovalPrompt(tx);
}
```

**Flow Diagram:**
```
Day 28, 00:00 UTC
    ↓
Agent: Creates unsigned transaction (40k MNEE)
    ↓
Checks YOUR database: Is 40k < 50k budget? ✅ Yes
    ↓
Sends unsigned TX to employer's wallet
    ↓
Wallet checks ITS rules: Is 40k < 50k auto-approve? ✅ Yes
    ↓
Wallet auto-signs using key (key NEVER left wallet)
    ↓
Sends signed TX back to backend
    ↓
Backend broadcasts to blockchain
    ↓
Done! Fully autonomous, zero key storage by platform
```

**Key Points:**
- ✅ Budget stored in YOUR database (just numbers)
- ✅ Private key stored in WALLET (never leaves)
- ✅ Wallet auto-approves based on rules
- ✅ Platform NEVER has access to private key
- ✅ Employer can change rules in wallet settings anytime

---

**Method 2: Smart Contract Spending Limits**

```typescript
// Employer deploys smart contract with built-in limits
const spendingContract = await deployContract({
  owner: employer.walletAddress,
  monthlyLimit: 50000,
  allowedRecipients: [employee1, employee2, employee3],
  allowedCaller: payrollPlatformAddress  // Only platform can call
});

// Employer transfers funds to contract
await employer.transfer(spendingContract.address, 100000);

// Platform calls contract (NO SIGNATURE NEEDED)
await spendingContract.executePayroll({
  recipients: [
    { address: employee1, amount: 3000 },
    { address: employee2, amount: 2500 }
  ]
});
// Contract validates: amount < limit? recipients allowed?
// If yes, executes automatically
```

**Key Points:**
- ✅ Funds in smart contract, not platform wallet
- ✅ Contract has programmed spending rules
- ✅ Platform can trigger within rules (no signature)
- ✅ Platform NEVER has private key
- ✅ Employer can withdraw from contract anytime

---

**Method 3: Delegation Signature (Advanced)**

```typescript
// Employer signs ONE permission document
const delegationSignature = await wallet.signMessage({
  message: JSON.stringify({
    platform: 'PayrollApp',
    permissions: ['execute_payroll'],
    monthlyLimit: 50000,
    validUntil: '2025-12-31',
    nonce: crypto.randomBytes(32).toString('hex')
  })
});

// Store signature in database (NOT private key!)
await prisma.delegation.create({
  employerId: 'abc123',
  delegationSignature: delegationSignature,  // ✅ Signature, not key
  permissions: { monthlyLimit: 50000 },
  expiresAt: '2025-12-31'
});

// When executing payroll, include delegation proof
const txWithProof = {
  ...unsignedTx,
  delegationSignature: delegation.signature,
  delegationMessage: delegation.message
};

// Blockchain validates delegation signature matches employer's public key
// If valid and within limits, executes without additional signature
```

**Key Points:**
- ✅ Employer signs permission ONCE
- ✅ Platform stores signature proof (not private key)
- ✅ Blockchain cryptographically verifies permission
- ✅ Platform NEVER has private key
- ✅ Employer can revoke by signing new message

---

#### 🔴 What NEVER To Do

```typescript
❌ ❌ ❌ TERRIBLE SECURITY - NEVER DO THIS ❌ ❌ ❌

// Storing WIF in database (even encrypted)
await prisma.employer.update({
  data: {
    privateKeyWif: employerWif,  // ❌ DISASTER!
    // Or even:
    encryptedWif: encrypt(employerWif, SECRET_KEY)  // ❌ STILL BAD!
  }
});

// Why this is catastrophic:
// 1. Database leak = ALL employer funds stolen
// 2. Insider threat - any admin can steal funds
// 3. Regulatory nightmare - you're a custodian
// 4. Single point of failure
// 5. No user will ever trust you
// 6. Even encryption doesn't help (key must be stored somewhere)
// 7. Server compromise = attacker gets encrypted WIF + decryption key
```

**Even if you encrypt the WIF:**
- Encryption key must be stored on your server
- If server is hacked, attacker gets both encrypted WIF AND key
- It's security theater, not real security

---

#### 📊 Comparison: Secure vs Insecure Pre-Approval

| Aspect | ✅ Secure (Budget Record) | ❌ Insecure (Stored WIF) |
|--------|-------------------------|------------------------|
| **Private Key Location** | Employer's wallet | Your database |
| **Platform Access** | None | Full access |
| **Database Breach Impact** | Zero - no keys to steal | Total loss - all funds stolen |
| **Insider Threat** | Impossible | Easy - admin copies keys |
| **Employer Trust** | High | Zero - won't use platform |
| **Regulatory Status** | Software provider | Money transmitter |
| **Single Point of Failure** | No | Yes |
| **Autonomy** | Yes (via wallet rules) | Yes |
| **Security** | ⭐⭐⭐⭐⭐ | ❌ |

---

#### 🎯 For Your Hackathon: Two-Phase Approach

**Week 1: Custodial (Demo Only)**
```typescript
// ONE platform wallet (YOUR key, not employers')
EMPLOYER_PRIVATE_KEY="5JZQ..."  // In .env

// Virtual balances per employer (just numbers)
employer.virtualBalance = 50000;

// This is OK for demo because:
// ✅ You control platform
// ✅ Testing only
// ✅ Shows working concept
// ✅ NOT storing employer keys
```

**Week 2: Show Non-Custodial Vision**
```typescript
// Database stores budget (NOT keys)
const budget = await prisma.payrollBudget.create({
  employerId: 'abc123',
  monthlyLimit: 50000  // ✅ Just a number
  // ❌ NO WIF KEY!
});

// Explain to judges:
"In production, employer's wallet has auto-approve rules.
 Transactions under 50k auto-sign without popup.
 Employer's private key NEVER leaves their wallet.
 We NEVER have access to their funds."
```

---

#### 🎤 How to Explain to Judges

**When judge asks:** "How do you automate payroll without storing private keys?"

**Your answer:**
```
"Great question! We use a three-layer approach:

1. BUDGET METADATA: Our database stores the approved budget limit -
   just a number, like '50,000 MNEE per month'. No keys.

2. WALLET RULES: The employer's wallet extension (like MetaMask)
   has auto-approve rules they configure themselves.
   If our transaction is under their limit, wallet auto-signs
   using the key that NEVER leaves their device.

3. FALLBACK: If amount exceeds the limit, wallet shows a popup
   for manual approval. So it's 95% automated, 100% secure.

Think of it like your bank's auto-pay. The bank doesn't have
your password - you pre-authorized specific payments up to
certain limits. Same concept, but with crypto."
```

**Follow-up:** "But what if wallet doesn't support auto-approve?"

**Your answer:**
```
"Phase 1 (our current demo) uses custodial model for simplicity -
perfect for companies managing their own payroll.

Phase 2 (our roadmap) offers two options:
- Smart contract spending limits (fully autonomous, no keys needed)
- Manual approval flow (semi-autonomous, maximum security)

We're showing both approaches to give customers flexibility
based on their security vs. automation preferences."
```

---

#### 🔐 Security Principles Summary

**Golden Rule:** Your platform should NEVER have access to employer private keys

**Acceptable:**
- ✅ Budget limits (numbers in database)
- ✅ Unsigned transactions
- ✅ Delegation signatures (proof, not key)
- ✅ Smart contract addresses
- ✅ Platform wallet for custodial model (YOUR wallet, not theirs)

**NEVER Acceptable:**
- ❌ Employer WIF keys
- ❌ Encrypted employer WIF keys
- ❌ Any form of employer private keys
- ❌ Seed phrases
- ❌ Mnemonic words

**Remember:** If your database gets hacked and employer funds get stolen, your platform is dead. Trust is everything in crypto.

---

### Real-World Example: MetaMask Pattern

MNEE wallet signing works exactly like MetaMask on Ethereum:

#### MetaMask (Ethereum)
```javascript
// Uniswap wants you to swap tokens
const tx = {
  to: '0xUniswapRouter',
  data: 'swapExactTokens...',
  value: '1000000000000000000' // 1 ETH
};

// MetaMask popup appears
await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [tx]
});

// User clicks "Confirm"
// Transaction broadcasts
```

#### MNEE Wallet (BSV)
```javascript
// Your app wants to pay employees
const tx = {
  recipients: [
    { address: '1ABC...', amount: 3000 },
    { address: '1DEF...', amount: 2500 }
  ]
};

// MNEE wallet popup appears
await window.mnee.signTransaction({
  rawtx: unsignedTx,
  description: 'Monthly payroll'
});

// User clicks "Sign"
// Transaction broadcasts
```

**Same UX pattern, different blockchain!**

### Implementation Challenges

#### Challenge 1: Wallet Extension Availability

**Problem:** MNEE may not have a browser extension yet (BSV ecosystem)

**Solutions:**
1. **Use existing BSV wallets** (HandCash, Money Button, RelayX)
2. **Deep links to mobile wallets** (if available)
3. **Build basic wallet interface** in your app (stores WIF encrypted)
4. **Wait for MNEE extension** and show prototype

#### Challenge 2: Transaction Expiry

**Problem:** Unsigned transactions become stale after 15-30 minutes

**Solutions:**
```typescript
// Auto-regenerate expired transactions
setInterval(async () => {
  const expired = await prisma.payrollApproval.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() }
    }
  });

  for (const approval of expired) {
    // Mark as expired
    await prisma.payrollApproval.update({
      where: { id: approval.id },
      data: { status: 'expired' }
    });

    // Create fresh unsigned transaction
    await createNewApprovalRequest(approval.employerId);
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

#### Challenge 3: Mobile Support

**Problem:** Wallet extensions don't work on mobile browsers

**Solutions:**
1. **Deep Linking:**
```typescript
// Generate deep link
const deepLink = `mnee://sign?tx=${encodeURIComponent(unsignedTx)}`;

// On mobile, clicking link opens MNEE wallet app
window.location.href = deepLink;
```

2. **Mobile App:**
Build React Native app with built-in wallet

3. **QR Code:**
```typescript
// Show QR code with transaction data
<QRCode value={JSON.stringify({ approvalId, unsignedTx })} />

// User scans with MNEE mobile wallet
// Wallet signs and submits
```

### Security Considerations

#### Private Key Storage

**Never do this:**
```typescript
❌ // Storing private key in database
await prisma.employer.update({
  data: { privateKey: wif } // NEVER!
});
```

**Instead:**
```typescript
✅ // User's wallet stores key
// Browser extension: Encrypted in browser storage
// Mobile app: Device keychain
// Your backend: NEVER sees the key
```

#### Transaction Validation

**Always validate before signing:**
```typescript
// Backend creates transaction
const approval = await createApproval({ ... });

// Frontend validates before prompting wallet
if (approval.totalAmount > expectedAmount) {
  throw new Error('Transaction amount mismatch!');
}

if (approval.recipients.length !== expectedRecipients) {
  throw new Error('Recipient count mismatch!');
}

// Only then request signature
await wallet.signTransaction({ ... });
```

#### Replay Attack Prevention

**Use idempotency:**
```typescript
// Each approval has unique ID
const approval = await prisma.payrollApproval.create({
  id: uuid(), // Unique ID
  unsignedTx: tx,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000)
});

// Can only be used once
if (approval.status !== 'pending') {
  throw new Error('Approval already used');
}
```

---

## 📊 Architecture Comparison

### Custodial (Week 1) vs Non-Custodial (Week 2)

| Aspect | Custodial | Non-Custodial |
|--------|-----------|---------------|
| **Key Storage** | Platform's .env file | User's wallet |
| **Trust Model** | Trust platform | Trustless |
| **Autonomy** | 100% autonomous | Semi-autonomous |
| **Security** | Single point of failure | Distributed security |
| **UX Friction** | Zero | One approval step |
| **Regulations** | Money transmitter | Software provider |
| **Implementation** | ⭐⭐ Simple | ⭐⭐⭐⭐ Complex |
| **Production Ready** | ⚠️ For small scale | ✅ Enterprise ready |

### When to Use Each Model

#### Use Custodial When:
- ✅ Building MVP/prototype
- ✅ Internal company use (trust yourself)
- ✅ Small user base with high trust
- ✅ Want 100% automation
- ✅ Hackathon demo

#### Use Non-Custodial When:
- ✅ Public SaaS platform
- ✅ Handling large amounts
- ✅ Regulatory compliance needed
- ✅ Enterprise customers
- ✅ Production deployment

---

## 🎬 Demo Strategy

### Week 1 Demo (Custodial Platform)

**Script:**
```
1. Show employer dashboard
   "Here's Company A with 10 employees"

2. Show virtual balance
   "They deposited 50,000 MNEE to the platform"

3. Show agent logs
   "Every day at midnight, the agent checks schedules"

4. Trigger manual payroll
   "Let me run payroll now..."
   *Click "Run Payroll"*

5. Show results
   "3 seconds later - all 10 employees paid!"
   *Show transaction hashes*

6. Show second company
   "Company B also uses the same platform"
   "Completely isolated data, separate balances"

7. Show platform stats
   "Platform has processed 100k MNEE across 50 companies"

Judges think: "Wow, this is scalable and actually works!"
```

### Week 2 Demo (Wallet Signing Prototype)

**Script:**
```
1. Show pending approval
   "For production, we're adding wallet signing"
   "Here's a pending payroll approval"

2. Show transaction details
   "Employer reviews: 5 employees, 25,000 MNEE"

3. Click approve
   "Employer clicks 'Approve with Wallet'"

4. Show wallet popup (if available)
   "Wallet extension prompts for signature"
   *Show prototype/mockup if no extension*

5. Explain security
   "Private key never leaves employer's device"
   "Platform can't steal funds"
   "Regulatory compliant"

6. Show roadmap
   "Phase 1: Custodial for ease of use ✅"
   "Phase 2: Wallet signing for security ⏳"
   "Phase 3: Pre-approved budgets for autonomy 📋"

Judges think: "These developers understand production requirements and security!"
```

---

## ⚠️ Risk Mitigation

### Week 1 Risks

| Risk | Mitigation |
|------|-----------|
| **Database corruption** | Daily backups, transaction atomicity |
| **Platform wallet compromise** | Use testnet, minimal funds, monitor alerts |
| **Concurrent payroll conflicts** | Database transactions, row locking |
| **Virtual balance mismatch** | Reconciliation job, audit logs |

### Week 2 Risks

| Risk | Mitigation |
|------|-----------|
| **MNEE wallet doesn't exist** | Use BSV wallet, build prototype UI, show mockup |
| **Transaction expiry issues** | Auto-regenerate, clear UI warnings |
| **Mobile support lacking** | Desktop-first approach, document mobile roadmap |
| **Complex integration** | Prototype only, don't over-commit |

---

## 📈 Success Metrics

### Week 1 Goals

- [ ] Database migrations successful
- [ ] 3+ test employers created
- [ ] Virtual balances working correctly
- [ ] Payroll deductions accurate
- [ ] Deposit/withdraw functional
- [ ] Frontend shows all balance data
- [ ] Platform statistics accurate
- [ ] Zero data leakage between employers
- [ ] All tests passing
- [ ] Demo video recorded

### Week 2 Goals

- [ ] Wallet signing architecture documented
- [ ] Unsigned transaction creation working
- [ ] Approval storage in database
- [ ] Frontend approval UI built
- [ ] Integration prototype (even if manual)
- [ ] Security model explained in pitch
- [ ] Production roadmap clear
- [ ] Judges impressed with vision

---

## 🚀 Next Steps

**Immediate Actions:**

1. ✅ Review this roadmap
2. ✅ Approve Week 1 implementation plan
3. ✅ Confirm starting now
4. ✅ Provide platform name/branding

**Week 1 Kickoff:**

1. Run database migrations
2. Implement balance service
3. Update payroll controller
4. Build frontend components
5. Test with multiple employers
6. Polish UI/UX
7. Record demo

**Week 2 Kickoff:**

1. Research MNEE wallet ecosystem
2. Design approval flow
3. Implement unsigned transaction creation
4. Build approval UI
5. Test integration
6. Document architecture
7. Finalize pitch

---

## 📚 Additional Resources

**References:**
- MNEE SDK Documentation: https://docs.mnee.io
- BSV Wallet Standards: https://bsvblockchain.org
- 1Sat Ordinals Protocol: https://docs.1satordinals.com
- MetaMask Signing Flow: https://docs.metamask.io/wallet/how-to/sign-data

**Tools:**
- Prisma Studio: Database visualization
- Postman: API testing
- MNEE CLI: Wallet management

**Support:**
- MNEE Discord: Community help
- BSV Documentation: Blockchain details
- Your hackathon mentors

---

**Questions?** Let's start building! 🚀
