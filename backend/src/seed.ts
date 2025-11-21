/**
 * Database Seed Script
 * Creates test employer and employees for development
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './middleware/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create test employer
  const employer = await prisma.employer.upsert({
    where: { walletAddress: 'mnee1test_employer_wallet_address_12345' },
    update: {},
    create: {
      walletAddress: 'mnee1test_employer_wallet_address_12345',
      companyName: 'Acme Corp',
      email: 'employer@acmecorp.com',
      payrollDay: 28,
      monthlyBudget: 50000,
      active: true
    }
  });

  logger.info(`✅ Created employer: ${employer.companyName} (${employer.id})`);

  // Create test employees
  const employees = [
    {
      name: 'Alice Johnson',
      email: 'alice@acmecorp.com',
      walletAddress: 'mnee1test_alice_wallet_address_67890',
      salaryAmount: 3000,
      paymentCycle: 'monthly',
      notes: 'Senior Developer'
    },
    {
      name: 'Bob Smith',
      email: 'bob@acmecorp.com',
      walletAddress: 'mnee1test_bob_wallet_address_11111',
      salaryAmount: 2500,
      paymentCycle: 'monthly',
      notes: 'Product Manager'
    },
    {
      name: 'Carol White',
      email: 'carol@acmecorp.com',
      walletAddress: 'mnee1test_carol_wallet_address_22222',
      salaryAmount: 2000,
      paymentCycle: 'monthly',
      notes: 'Designer'
    }
  ];

  for (const empData of employees) {
    // Check if employee already exists
    const existing = await prisma.employee.findFirst({
      where: {
        employerId: employer.id,
        walletAddress: empData.walletAddress
      }
    });

    if (existing) {
      logger.info(`⏭️  Employee ${empData.name} already exists, skipping`);
      continue;
    }

    const employee = await prisma.employee.create({
      data: {
        employerId: employer.id,
        ...empData
      }
    });
    logger.info(`✅ Created employee: ${employee.name}`);
  }

  // Create a sample completed payroll log
  const sampleLog = await prisma.payrollLog.create({
    data: {
      employerId: employer.id,
      employeeId: (await prisma.employee.findFirst({ where: { employerId: employer.id } }))!.id,
      amount: 3000,
      status: 'completed',
      txHash: 'mnee_tx_sample_12345abcdef',
      idempotencyKey: `sample-${Date.now()}`,
      confirmedAt: new Date(),
      metadata: {
        testData: true
      }
    }
  });

  logger.info(`✅ Created sample payroll log: ${sampleLog.id}`);

  // Create sample alerts
  await prisma.alert.create({
    data: {
      employerId: employer.id,
      severity: 'info',
      category: 'optimization',
      title: 'Payroll Optimization Tip',
      message: 'Consider scheduling payroll 2 days before month-end to ensure sufficient processing time.',
      resolved: false
    }
  });

  await prisma.alert.create({
    data: {
      employerId: employer.id,
      severity: 'warning',
      category: 'optimization',
      title: 'Budget Warning',
      message: 'Your total monthly payroll (7500 MNEE) is approaching your budget limit (50000 MNEE).',
      resolved: false
    }
  });

  logger.info('✅ Created sample alerts');

  // Initialize system config
  await prisma.systemConfig.upsert({
    where: { id: 'system' },
    update: {},
    create: {
      id: 'system',
      agentEnabled: true,
      minSalaryAmount: 100,
      maxSalaryAmount: 100000
    }
  });

  logger.info('✅ Initialized system config');

  logger.info('🎉 Database seed completed successfully!');
  logger.info('');
  logger.info('Test Credentials:');
  logger.info(`  Employer Wallet: ${employer.walletAddress}`);
  logger.info(`  Company: ${employer.companyName}`);
  logger.info(`  Employees: ${employees.length}`);
  logger.info('');
  logger.info('💡 You can now:');
  logger.info('  1. Start the backend: npm run dev');
  logger.info('  2. Connect with wallet: mnee1test_employer_wallet_address_12345');
  logger.info('  3. View employees in the dashboard');
  logger.info('  4. Run test payroll');
}

main()
  .catch((e) => {
    logger.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
