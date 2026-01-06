/**
 * Script to generate Ethereum test wallets for MNEE Autonomous Payroll
 * Usage: npx tsx scripts/generate-eth-wallets.ts
 */

import { ethers } from 'ethers';

console.log('🔐 Generating Ethereum Test Wallets for MNEE Hackathon\n');
console.log('='.repeat(70));

const wallets = [
  { role: 'Platform Wallet', envPrefix: 'PLATFORM' },
  { role: 'Employer (Acme Corp)', envPrefix: 'EMPLOYER' },
  { role: 'Employee 1 (Alice)', envPrefix: 'EMPLOYEE_1' },
  { role: 'Employee 2 (Bob)', envPrefix: 'EMPLOYEE_2' },
  { role: 'Employee 3 (Carol)', envPrefix: 'EMPLOYEE_3' }
];

console.log('\n🎯 Generating 5 wallets for testing:\n');

const generatedWallets: Array<{ role: string; address: string; privateKey: string }> = [];

for (const { role, envPrefix } of wallets) {
  console.log(`\n📝 ${role}:`);
  console.log('-'.repeat(70));

  const wallet = ethers.Wallet.createRandom();

  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log(`Mnemonic:    ${wallet.mnemonic?.phrase}`);

  generatedWallets.push({
    role,
    address: wallet.address,
    privateKey: wallet.privateKey
  });
}

console.log('\n' + '='.repeat(70));
console.log('\n📋 .env Entries (COPY TO YOUR .env FILE):\n');
console.log('# Ethereum Configuration (MNEE Hackathon)');
console.log('ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"');
console.log('ETHEREUM_CHAIN_ID=11155111  # Sepolia testnet');
console.log('MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"');
console.log('');
console.log(`PLATFORM_WALLET_ADDRESS="${generatedWallets[0].address}"`);
console.log(`PLATFORM_PRIVATE_KEY="${generatedWallets[0].privateKey}"`);
console.log('');
console.log('# Test Accounts');
console.log(`EMPLOYER_ADDRESS="${generatedWallets[1].address}"`);
console.log(`EMPLOYEE_1_ADDRESS="${generatedWallets[2].address}"`);
console.log(`EMPLOYEE_2_ADDRESS="${generatedWallets[3].address}"`);
console.log(`EMPLOYEE_3_ADDRESS="${generatedWallets[4].address}"`);

console.log('\n' + '='.repeat(70));
console.log('\n📝 Seed Data Addresses (FOR backend/src/seed.ts):\n');
console.log('// Employer');
console.log(`walletAddress: '${generatedWallets[1].address}'`);
console.log('\n// Employees');
console.log(`{ walletAddress: '${generatedWallets[2].address}' },  // Alice`);
console.log(`{ walletAddress: '${generatedWallets[3].address}' },  // Bob`);
console.log(`{ walletAddress: '${generatedWallets[4].address}' }   // Carol`);

console.log('\n' + '='.repeat(70));
console.log('\n✅ NEXT STEPS:\n');
console.log('1. Copy the .env entries above to your backend/.env file');
console.log('2. Get an Infura API key from https://infura.io/ (free)');
console.log('3. Replace YOUR_INFURA_KEY with your actual key');
console.log('4. Get Sepolia testnet ETH from https://sepoliafaucet.com/');
console.log(`   → Send to: ${generatedWallets[0].address}`);
console.log('5. Get test MNEE tokens from hackathon organizers');
console.log('6. Update backend/src/seed.ts with the addresses above');
console.log('7. Run: cd backend && npm run db:seed');
console.log('8. Start building! 🚀');

console.log('\n⚠️  SECURITY WARNINGS:');
console.log('   • These are TEST wallets - DO NOT use on mainnet');
console.log('   • NEVER commit private keys to Git');
console.log('   • Keep private keys in .env (already in .gitignore)');
console.log('   • For production, use hardware wallets or key management systems\n');
