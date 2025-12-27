/**
 * Zustand Store
 * Global state management for wallet and employer
 * Updated for Ethereum (MNEE Hackathon)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Employer } from './api';

// Validate Ethereum address format (0x + 40 hex characters)
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

interface AppState {
  // Wallet state
  walletAddress: string | null;
  isConnected: boolean;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;

  // Employer state
  employer: Employer | null;
  setEmployer: (employer: Employer | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Wallet state
      walletAddress: null,
      isConnected: false,

      connectWallet: (address: string) => {
        // Validate Ethereum address format
        if (!isValidEthereumAddress(address)) {
          console.error('Invalid Ethereum address format:', address);
          return;
        }
        set({ walletAddress: address, isConnected: true });
      },

      disconnectWallet: () => set({
        walletAddress: null,
        isConnected: false,
        employer: null
      }),

      // Employer state
      employer: null,
      setEmployer: (employer: Employer | null) => set({ employer }),
    }),
    {
      name: 'mnee-payroll-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialPersist: true, // Only persist specified keys
    }
  )
);
