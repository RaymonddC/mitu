/**
 * SimpleBatchTransfer Contract ABI
 *
 * This contract allows batching multiple ERC20 transfers into one transaction
 * Deploy instructions: See contracts/README_BATCH_DEPLOY.md
 */

export const BATCH_TRANSFER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" }
    ],
    name: "batchTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "count", type: "uint256" }
    ],
    name: "estimateGasSavings",
    outputs: [
      { internalType: "uint256", name: "percentSaved", type: "uint256" }
    ],
    stateMutability: "pure",
    type: "function"
  }
] as const;

/**
 * Get batch transfer contract address from environment
 * Returns null if not deployed yet
 */
export function getBatchContractAddress(): string | null {
  const address = process.env.NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS;

  if (!address || address.includes('0xYour') || address.includes('your_')) {
    return null;
  }

  return address;
}

/**
 * Check if batch transfers are available
 */
export function isBatchTransferAvailable(): boolean {
  return getBatchContractAddress() !== null;
}

/**
 * Calculate estimated gas savings for batch transfer
 * @param employeeCount Number of employees to pay
 * @returns Object with individual cost, batch cost, and savings
 */
export function calculateGasSavings(employeeCount: number) {
  const GAS_PRICE_GWEI = 20; // Average Sepolia gas price
  const ETH_PRICE_USD = 2000; // Approximate ETH price

  // Individual transfer costs
  const INDIVIDUAL_TRANSFER_GAS = 65000;
  const individualGasTotal = INDIVIDUAL_TRANSFER_GAS * employeeCount;
  const individualCostETH = (individualGasTotal * GAS_PRICE_GWEI) / 1e9;
  const individualCostUSD = individualCostETH * ETH_PRICE_USD;

  // Batch transfer costs (base + per-transfer)
  const BATCH_BASE_GAS = 50000;
  const BATCH_PER_TRANSFER_GAS = 40000;
  const batchGasTotal = BATCH_BASE_GAS + (BATCH_PER_TRANSFER_GAS * employeeCount);
  const batchCostETH = (batchGasTotal * GAS_PRICE_GWEI) / 1e9;
  const batchCostUSD = batchCostETH * ETH_PRICE_USD;

  // Savings
  const savingsUSD = individualCostUSD - batchCostUSD;
  const savingsPercent = Math.round((savingsUSD / individualCostUSD) * 100);

  return {
    individual: {
      gas: individualGasTotal,
      costETH: individualCostETH.toFixed(6),
      costUSD: individualCostUSD.toFixed(2)
    },
    batch: {
      gas: batchGasTotal,
      costETH: batchCostETH.toFixed(6),
      costUSD: batchCostUSD.toFixed(2)
    },
    savings: {
      costUSD: savingsUSD.toFixed(2),
      percent: savingsPercent
    }
  };
}
