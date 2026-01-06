import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying SimpleBatchTransfer V2 (with totalAmount parameter)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying from address:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy the contract
  const SimpleBatchTransfer = await ethers.getContractFactory("SimpleBatchTransfer");
  const batchTransfer = await SimpleBatchTransfer.deploy();

  await batchTransfer.waitForDeployment();
  const contractAddress = await batchTransfer.getAddress();

  console.log("✅ SimpleBatchTransfer V2 deployed to:", contractAddress);
  console.log("\n📋 Next steps:");
  console.log("1. Update frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS="${contractAddress}"`);
  console.log("\n2. Verify on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("\n3. OLD users need to RE-APPROVE the new contract");
  console.log("   (The old approval won't work with the new contract)");
  console.log("\n🔗 View on Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
