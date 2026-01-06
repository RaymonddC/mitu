/**
 * Script to generate test wallets for MNEE
 * Usage: npx tsx scripts/create-test-wallets.ts
 */

import { HDWallet } from '@mnee/ts-sdk';

console.log('🔐 Generating MNEE Test Wallets\n');
console.log('=' .repeat(60));

// Generate 3 test wallets
for (let i = 1; i <= 3; i++) {
  console.log(`\n📝 Test Wallet ${i}:`);
  console.log('-'.repeat(60));

  // Generate mnemonic
  const mnemonic = HDWallet.generateMnemonic();
  console.log(`Mnemonic: ${mnemonic}`);

  // Create HD wallet
  const hdWallet = new HDWallet(mnemonic);

  // Derive first address
  const addressInfo = hdWallet.deriveAddress(0, false);

  console.log(`\nAddress:     ${addressInfo.address}`);
  console.log(`WIF Key:     ${addressInfo.privateKey}`);
  console.log(`Path:        ${addressInfo.path}`);

  console.log(`\n.env entry:`);
  console.log(`EMPLOYER_${i}_ADDRESS="${addressInfo.address}"`);
  console.log(`EMPLOYER_${i}_PRIVATE_KEY="${addressInfo.privateKey}"`);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Done! Copy the .env entries above to your .env file');
console.log('\n⚠️  IMPORTANT: These are TEST wallets - NEVER use for mainnet!');
console.log('⚠️  Keep WIF keys SECRET - anyone with the key can spend funds!\n');
