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
  // Using Ethereum address format (MNEE Hackathon pivot)
  // Using small amounts (0.00xx) for testnet faucet compatibility
  const employer = await prisma.employer.upsert({
    where: { walletAddress: '0x672541F8b64eA491382ee7801c07f18E336f80B1' },
    update: {},
    create: {
      walletAddress: '0x672541F8b64eA491382ee7801c07f18E336f80B1',
      companyName: 'Acme Corp',
      email: 'employer@acmecorp.com',
      payrollDay: 28,
      monthlyBudget: 1,  // 1 MNEE monthly budget (testnet friendly)
      active: true,
      virtualBalance: 0.5 // Initial 0.5 MNEE virtual balance (easy to get from faucet)
    }
  });

  logger.info(`✅ Created employer: ${employer.companyName} (${employer.id})`);

  // Create test employees
  // Using Ethereum address formats (MNEE Hackathon pivot)
  // Using small amounts (0.00xx) for testnet faucet compatibility
  const employees = [
    {
      name: 'Alice Johnson',
      email: 'alice@acmecorp.com',
      walletAddress: '0x402fe369CE8E21362EeC92BaB49B5B634710336e',
      salaryAmount: 0.15,  // 0.15 MNEE/month (testnet friendly)
      paymentCycle: 'monthly',
      notes: 'Senior Developer'
    },
    {
      name: 'Bob Smith',
      email: 'bob@acmecorp.com',
      walletAddress: '0x640B46B16a456Ee60fc3816A43973533155b1cb1',
      salaryAmount: 0.12,  // 0.12 MNEE/month (testnet friendly)
      paymentCycle: 'monthly',
      notes: 'Product Manager'
    },
    {
      name: 'Carol White',
      email: 'carol@acmecorp.com',
      walletAddress: '0xF2207433F5B108A86fE3FA8eCC8485E0B8Ade837',
      salaryAmount: 0.10,  // 0.10 MNEE/month (testnet friendly)
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
      amount: 0.15,  // Testnet friendly amount
      status: 'completed',
      txHash: '0x8f3d9e7c2b1a4d6f5e8c9a7b3d2e1f4a6b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3',  // Ethereum tx hash format
      idempotencyKey: `sample-${Date.now()}`,
      confirmedAt: new Date(),
      metadata: {
        testData: true,
        blockchain: 'ethereum',
        network: 'sepolia'
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
      message: 'Your total monthly payroll (0.37 MNEE) is approaching your budget limit (1 MNEE).',
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
  logger.info('✅ ETHEREUM MIGRATION COMPLETE');
  logger.info('');
  logger.info('Test Credentials:');
  logger.info(`  Employer Wallet (ETH): ${employer.walletAddress}`);
  logger.info(`  Company: ${employer.companyName}`);
  logger.info(`  Employees: ${employees.length}`);
  logger.info(`  Virtual Balance: ${employer.virtualBalance} MNEE`);
  logger.info('');
  logger.info('💡 You can now:');
  logger.info('  1. Get Sepolia testnet ETH from https://sepoliafaucet.com/');
  logger.info('  2. Get test MNEE tokens from hackathon organizers');
  logger.info('  3. Start the backend: npm run dev');
  logger.info(`  4. Connect MetaMask wallet: ${employer.walletAddress}`);
  logger.info('  5. View employees and virtual balance in the dashboard');
  logger.info('  6. Run test payroll (will use MNEE ERC-20 transfers)');
}

main()
  .catch((e) => {
    logger.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
