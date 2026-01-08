import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format wallet address
 */
export function formatWalletAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'MNEE'): string {
  return `${amount.toLocaleString()} ${currency}`;
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-green-600 bg-green-50',
    pending: 'text-yellow-600 bg-yellow-50',
    failed: 'text-red-600 bg-red-50',
    retrying: 'text-blue-600 bg-blue-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50',
  };
  return colors[severity] || 'text-gray-600 bg-gray-50';
}

/**
 * Get Etherscan transaction URL based on chain ID
 */
export function getEtherscanTxUrl(txHash: string, chainId: number = 1): string {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}
