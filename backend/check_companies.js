// Quick script to check companies in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompanies() {
  try {
    // Get ALL employers (including deleted)
    const allEmployers = await prisma.employer.findMany({
      select: {
        id: true,
        companyName: true,
        walletAddress: true,
        active: true,
        isDeleted: true,
        deletedAt: true,
      }
    });

    console.log('\n=== ALL COMPANIES IN DATABASE ===');
    console.log(`Total: ${allEmployers.length}\n`);

    allEmployers.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.companyName}`);
      console.log(`   Wallet: ${emp.walletAddress}`);
      console.log(`   Active: ${emp.active}`);
      console.log(`   IsDeleted: ${emp.isDeleted}`);
      console.log(`   DeletedAt: ${emp.deletedAt || 'null'}`);
      console.log('');
    });

    // Get only non-deleted employers (what API returns)
    const activeEmployers = await prisma.employer.findMany({
      where: {
        active: true,
        isDeleted: false
      },
      select: {
        id: true,
        companyName: true,
        walletAddress: true,
      }
    });

    console.log('\n=== COMPANIES RETURNED BY API ===');
    console.log(`Total: ${activeEmployers.length}\n`);

    activeEmployers.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.companyName} (${emp.walletAddress})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanies();
