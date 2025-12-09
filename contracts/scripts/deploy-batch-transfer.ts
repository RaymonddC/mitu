/**
 * Deployment script for SimpleBatchTransfer contract
 *
 * Usage:
 *   1. Set PRIVATE_KEY in .env (deployer wallet)
 *   2. Run: tsx contracts/scripts/deploy-batch-transfer.ts
 *
 * This will deploy to Sepolia testnet and save the address
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// SimpleBatchTransfer contract ABI and bytecode
// Generated from: npx solc --optimize --bin --abi SimpleBatchTransfer.sol
const BATCH_TRANSFER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "address[]", "name": "recipients", "type": "address[]" },
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "name": "batchTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "count", "type": "uint256" }
    ],
    "name": "estimateGasSavings",
    "outputs": [
      { "internalType": "uint256", "name": "percentSaved", "type": "uint256" }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
];

// NOTE: This is a placeholder bytecode
// To get the real bytecode, compile the Solidity contract with:
// npx solc --optimize --bin contracts/src/SimpleBatchTransfer.sol
const BATCH_TRANSFER_BYTECODE = "TO_BE_COMPILED";

async function main() {
  console.log('🚀 Deploying SimpleBatchTransfer to Sepolia...\n');

  // Load environment
  const PRIVATE_KEY = process.env.EMPLOYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';

  if (!PRIVATE_KEY || PRIVATE_KEY.includes('your_')) {
    console.error('❌ Error: PRIVATE_KEY not set in .env');
    console.error('   Set EMPLOYER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  if (BATCH_TRANSFER_BYTECODE === 'TO_BE_COMPILED') {
    console.error('❌ Error: Contract not compiled yet');
    console.error('   Compile first with: npx solc --optimize --bin contracts/src/SimpleBatchTransfer.sol');
    console.error('   Then update BATCH_TRANSFER_BYTECODE in this script');
    process.exit(1);
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📍 Deployer address: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('❌ Insufficient balance. Get Sepolia ETH from https://sepoliafaucet.com/');
    process.exit(1);
  }

  // Deploy contract
  console.log('\n📝 Deploying contract...');
  const factory = new ethers.ContractFactory(
    BATCH_TRANSFER_ABI,
    BATCH_TRANSFER_BYTECODE,
    wallet
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log('\n✅ Contract deployed successfully!');
  console.log(`📍 Address: ${address}`);
  console.log(`🔍 Etherscan: https://sepolia.etherscan.io/address/${address}`);

  // Save deployment info
  const deploymentInfo = {
    address,
    abi: BATCH_TRANSFER_ABI,
    network: 'sepolia',
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
  };

  const outputPath = path.join(__dirname, '..', 'deployments', 'batch-transfer.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${outputPath}`);

  // Update .env.example
  console.log('\n📋 Add this to your .env file:');
  console.log(`BATCH_TRANSFER_CONTRACT_ADDRESS="${address}"`);

  console.log('\n✨ Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
