-- AlterTable: Add new fields to employers
ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;
ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "virtualBalance" DECIMAL(20,8) NOT NULL DEFAULT 0;
ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "totalDeposited" DECIMAL(20,8) NOT NULL DEFAULT 0;
ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "totalWithdrawn" DECIMAL(20,8) NOT NULL DEFAULT 0;
ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "depositAddress" TEXT;
ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "balanceUpdatedAt" TIMESTAMP(3);

-- AlterTable: Add new field to employees
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;

-- CreateTable: balance_transactions
CREATE TABLE IF NOT EXISTS "balance_transactions" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "balanceBefore" DECIMAL(20,8) NOT NULL,
    "balanceAfter" DECIMAL(20,8) NOT NULL,
    "description" TEXT,
    "txHash" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: platform_stats
CREATE TABLE IF NOT EXISTS "platform_stats" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "totalDeposits" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalPayrollPaid" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalEmployers" INTEGER NOT NULL DEFAULT 0,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payroll_approvals
CREATE TABLE IF NOT EXISTS "payroll_approvals" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "unsignedTx" TEXT,
    "signedTx" TEXT,
    "totalAmount" DECIMAL(20,8) NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "recipients" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "broadcastedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "ticketId" TEXT,
    "description" TEXT,
    "metadata" JSONB,

    CONSTRAINT "payroll_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payroll_budgets
CREATE TABLE IF NOT EXISTS "payroll_budgets" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "monthlyLimit" DECIMAL(20,8) NOT NULL,
    "perEmployeeLimit" DECIMAL(20,8),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "usedThisMonth" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Add new indexes
CREATE UNIQUE INDEX IF NOT EXISTS "employers_depositAddress_key" ON "employers"("depositAddress");
DROP INDEX IF EXISTS "employers_walletAddress_key"; -- Remove unique constraint
CREATE INDEX IF NOT EXISTS "employers_walletAddress_idx" ON "employers"("walletAddress");

CREATE INDEX IF NOT EXISTS "balance_transactions_employerId_createdAt_idx" ON "balance_transactions"("employerId", "createdAt");
CREATE INDEX IF NOT EXISTS "balance_transactions_type_idx" ON "balance_transactions"("type");

CREATE INDEX IF NOT EXISTS "payroll_approvals_employerId_status_idx" ON "payroll_approvals"("employerId", "status");
CREATE INDEX IF NOT EXISTS "payroll_approvals_status_expiresAt_idx" ON "payroll_approvals"("status", "expiresAt");

CREATE INDEX IF NOT EXISTS "payroll_budgets_employerId_isActive_idx" ON "payroll_budgets"("employerId", "isActive");

-- AddForeignKey: Add foreign keys for new tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'balance_transactions_employerId_fkey'
    ) THEN
        ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_employerId_fkey"
        FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payroll_approvals_employerId_fkey'
    ) THEN
        ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_employerId_fkey"
        FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payroll_budgets_employerId_fkey'
    ) THEN
        ALTER TABLE "payroll_budgets" ADD CONSTRAINT "payroll_budgets_employerId_fkey"
        FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
