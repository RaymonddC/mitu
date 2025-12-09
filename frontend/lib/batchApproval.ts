import { encodeFunctionData, erc20Abi, parseEther, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { getBatchContractAddress } from './batchTransferABI';

const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

export interface BatchApprovalStatus {
  isApproved: boolean;
  allowance: bigint;
  needsApproval: boolean;
}

// Create public client for read operations
const getPublicClient = () => {
  return createPublicClient({
    chain: sepolia,
    transport: http()
  });
};

/**
 * Check if the batch contract has been approved to spend tokens
 * This is a FREE read-only operation (no gas cost)
 */
export async function checkBatchApproval(
  walletClient: any,
  userAddress: string,
  tokenAddress: string
): Promise<boolean> {
  try {
    const batchContract = getBatchContractAddress();
    if (!batchContract) return false;

    const publicClient = getPublicClient();

    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [userAddress as `0x${string}`, batchContract as `0x${string}`]
    });

    console.log('Batch approval check:', {
      userAddress,
      batchContract,
      tokenAddress,
      allowance: allowance.toString(),
      isApproved: allowance > 0n
    });

    return allowance > 0n;
  } catch (error) {
    console.error('Error checking batch approval:', error);
    return false;
  }
}

/**
 * Get detailed approval status including allowance amount
 * This is a FREE read-only operation (no gas cost)
 */
export async function getBatchApprovalStatus(
  walletClient: any,
  userAddress: string,
  tokenAddress: string
): Promise<BatchApprovalStatus> {
  try {
    const batchContract = getBatchContractAddress();
    if (!batchContract) {
      return {
        isApproved: false,
        allowance: 0n,
        needsApproval: false
      };
    }

    const publicClient = getPublicClient();

    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [userAddress as `0x${string}`, batchContract as `0x${string}`]
    });

    const isApproved = allowance > 0n;

    console.log('Batch approval status:', {
      userAddress,
      batchContract,
      allowance: allowance.toString(),
      isApproved
    });

    return {
      isApproved,
      allowance,
      needsApproval: !isApproved
    };
  } catch (error) {
    console.error('Error getting batch approval status:', error);
    return {
      isApproved: false,
      allowance: 0n,
      needsApproval: true
    };
  }
}

/**
 * Execute approval transaction to allow batch contract to spend tokens
 * This costs gas (~$1-2, one-time operation)
 *
 * @param amount - Optional specific amount to approve. Default is MAX_UINT256 (unlimited)
 * @returns Transaction hash
 */
export async function approveBatchContract(
  walletClient: any,
  userAddress: string,
  tokenAddress: string,
  amount: bigint = MAX_UINT256
): Promise<string> {
  const batchContract = getBatchContractAddress();
  if (!batchContract) {
    throw new Error('Batch contract address not configured');
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [batchContract as `0x${string}`, amount]
  });

  const hash = await walletClient.sendTransaction({
    to: tokenAddress,
    data,
    account: userAddress as `0x${string}`,
    chain: walletClient.chain
  });

  return hash;
}

/**
 * Revoke approval for batch contract (set allowance to 0)
 * This costs gas (~$1-2)
 */
export async function revokeBatchApproval(
  walletClient: any,
  userAddress: string,
  tokenAddress: string
): Promise<string> {
  return approveBatchContract(walletClient, userAddress, tokenAddress, 0n);
}
