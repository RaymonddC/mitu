-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT,
    "profileImage" TEXT,
    "payrollDay" INTEGER NOT NULL DEFAULT 28,
    "monthlyBudget" DECIMAL(20,8),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "virtualBalance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalDeposited" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "depositAddress" TEXT,
    "balanceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "profileImage" TEXT,
    "walletAddress" TEXT NOT NULL,
    "salaryAmount" DECIMAL(20,8) NOT NULL,
    "paymentCycle" TEXT NOT NULL DEFAULT 'monthly',
    "customPayDay" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_logs" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL,
    "failureReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "payroll_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "agentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAgentRun" TIMESTAMP(3),
    "minSalaryAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "maxSalaryAmount" DECIMAL(20,8) NOT NULL DEFAULT 1000000,
    "settings" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "employers_depositAddress_key" ON "employers"("depositAddress");

-- CreateIndex
CREATE INDEX "employers_walletAddress_idx" ON "employers"("walletAddress");

-- CreateIndex
CREATE INDEX "employees_employerId_idx" ON "employees"("employerId");

-- CreateIndex
CREATE INDEX "employees_walletAddress_idx" ON "employees"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_logs_idempotencyKey_key" ON "payroll_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payroll_logs_employerId_idx" ON "payroll_logs"("employerId");

-- CreateIndex
CREATE INDEX "payroll_logs_employeeId_idx" ON "payroll_logs"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_logs_status_idx" ON "payroll_logs"("status");

-- CreateIndex
CREATE INDEX "payroll_logs_executedAt_idx" ON "payroll_logs"("executedAt");

-- CreateIndex
CREATE INDEX "payroll_logs_idempotencyKey_idx" ON "payroll_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "alerts_employerId_idx" ON "alerts"("employerId");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_resolved_idx" ON "alerts"("resolved");

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

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_logs" ADD CONSTRAINT "payroll_logs_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_logs" ADD CONSTRAINT "payroll_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_budgets" ADD CONSTRAINT "payroll_budgets_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
