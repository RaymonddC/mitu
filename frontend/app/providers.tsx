'use client';

/**
 * Web3 Providers
 * Configures RainbowKit + Wagmi for MetaMask/Ethereum wallet connections
 * MNEE Hackathon - Ethereum Integration
 */

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, connectorsForWallets, darkTheme } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet, walletConnectWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
// Get the correct chain based on environment variable
const chain = process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID === '1' ? mainnet : sepolia;

// Configure wallets with WalletConnect enabled
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet, injectedWallet],
    },
  ],
  {
    appName: 'MNEE Autonomous Payroll',
    projectId,
  }
);

// Create wagmi config with dynamic chain
const config = createConfig({
  connectors,
  chains: [chain],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}
          theme={darkTheme({
            accentColor: '#3b82f6',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
