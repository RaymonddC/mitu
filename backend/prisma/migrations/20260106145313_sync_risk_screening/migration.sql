/*
  Warnings:

  - A unique constraint covering the columns `[depositAddress]` on the table `employers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "employers_walletAddress_key";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "profileImage" TEXT;

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "balanceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "depositAddress" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "totalDeposited" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN     "totalWithdrawn" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN     "virtualBalance" DECIMAL(20,8) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "balance_transactions" (
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

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "totalDeposits" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalPayrollPaid" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalEmployers" INTEGER NOT NULL DEFAULT 0,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_approvals" (
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

-- CreateTable
CREATE TABLE "payroll_budgets" (
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

-- CreateTable
CREATE TABLE "risk_screenings" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "breakdown" JSONB,
    "summary" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT,
    "employerId" TEXT,

    CONSTRAINT "risk_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_transactions_employerId_createdAt_idx" ON "balance_transactions"("employerId", "createdAt");

-- CreateIndex
CREATE INDEX "balance_transactions_type_idx" ON "balance_transactions"("type");

-- CreateIndex
CREATE INDEX "payroll_approvals_employerId_status_idx" ON "payroll_approvals"("employerId", "status");

-- CreateIndex
CREATE INDEX "payroll_approvals_status_expiresAt_idx" ON "payroll_approvals"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "payroll_budgets_employerId_isActive_idx" ON "payroll_budgets"("employerId", "isActive");

-- CreateIndex
CREATE INDEX "risk_screenings_walletAddress_idx" ON "risk_screenings"("walletAddress");

-- CreateIndex
CREATE INDEX "risk_screenings_riskScore_idx" ON "risk_screenings"("riskScore");

-- CreateIndex
CREATE INDEX "risk_screenings_riskLevel_idx" ON "risk_screenings"("riskLevel");

-- CreateIndex
CREATE INDEX "risk_screenings_blocked_idx" ON "risk_screenings"("blocked");

-- CreateIndex
CREATE INDEX "risk_screenings_createdAt_idx" ON "risk_screenings"("createdAt");

-- CreateIndex
CREATE INDEX "risk_screenings_employerId_idx" ON "risk_screenings"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "employers_depositAddress_key" ON "employers"("depositAddress");

-- CreateIndex
CREATE INDEX "employers_walletAddress_idx" ON "employers"("walletAddress");

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_budgets" ADD CONSTRAINT "payroll_budgets_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_screenings" ADD CONSTRAINT "risk_screenings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_screenings" ADD CONSTRAINT "risk_screenings_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
