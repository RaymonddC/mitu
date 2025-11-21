/**
 * Zustand Store
 * Global state management for wallet and employer
 */

import { create } from 'zustand';
import { Employer } from './api';

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

export const useStore = create<AppState>((set) => ({
  // Wallet state
  walletAddress: null,
  isConnected: false,
  connectWallet: (address: string) => set({ walletAddress: address, isConnected: true }),
  disconnectWallet: () => set({ walletAddress: null, isConnected: false, employer: null }),

  // Employer state
  employer: null,
  setEmployer: (employer: Employer | null) => set({ employer }),
}));
