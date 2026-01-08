-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT,
    "payrollDay" INTEGER NOT NULL DEFAULT 28,
    "monthlyBudget" DECIMAL(20,8),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "employers_walletAddress_key" ON "employers"("walletAddress");

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

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_logs" ADD CONSTRAINT "payroll_logs_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_logs" ADD CONSTRAINT "payroll_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
