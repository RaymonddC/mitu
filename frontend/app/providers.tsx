'use client';

/**
 * Web3 Providers
 * Configures RainbowKit + Wagmi for MetaMask/Ethereum wallet connections
 * MNEE Hackathon - Ethereum Integration
 */

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Configure wallet connection for MNEE Hackathon
const config = getDefaultConfig({
  appName: 'MNEE Autonomous Payroll',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [
    sepolia,  // Sepolia testnet for development
    // mainnet  // Uncomment for production
  ],
  ssr: true,  // Enable server-side rendering support
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
