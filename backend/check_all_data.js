// Check all data in database including deleted records
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllData() {
  try {
    console.log('\n=== CHECKING ALL DATABASE TABLES ===\n');

    // Check employers (including deleted)
    const employers = await prisma.employer.findMany();
    console.log(`Employers: ${employers.length}`);
    employers.forEach(emp => {
      console.log(`  - ${emp.companyName} (isDeleted: ${emp.isDeleted}, active: ${emp.active})`);
    });

    // Check employees
    const employees = await prisma.employee.findMany();
    console.log(`\nEmployees: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  - ${emp.name}`);
    });

    // Check payroll logs
    const payrollLogs = await prisma.payrollLog.findMany();
    console.log(`\nPayroll Logs: ${payrollLogs.length}`);

    // Check balance transactions
    const balanceTransactions = await prisma.balanceTransaction.findMany();
    console.log(`\nBalance Transactions: ${balanceTransactions.length}`);

    console.log('\n=== DATABASE CHECK COMPLETE ===\n');

    // Check if database was recently cleared
    if (employers.length === 0 && employees.length === 0) {
      console.log('⚠️  DATABASE IS EMPTY - All tables have been cleared!');
      console.log('\nPossible reasons:');
      console.log('1. Database was reset/cleared');
      console.log('2. Migration with --accept-data-loss flag deleted data');
      console.log('3. Manual deletion occurred');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
