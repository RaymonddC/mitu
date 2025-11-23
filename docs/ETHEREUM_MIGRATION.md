# MNEE Ethereum Migration Guide

**Date**: November 24, 2025
**Purpose**: Migrate MNEE Autonomous Payroll from Bitcoin SV/1Sat Ordinals to Ethereum MNEE Stablecoin
**Hackathon**: https://mnee-eth.devpost.com/

---

## 🎯 Migration Overview

### What Changed
- **FROM**: MNEE Network (Bitcoin SV / 1Sat Ordinals)
- **TO**: Ethereum Mainnet/Sepolia with MNEE ERC-20 Stablecoin

### Why This Migration
The MNEE hackathon requirements specify:
- Platform: **Ethereum blockchain**
- Token: **MNEE USD-backed stablecoin (ERC-20)**
- Contract Address: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- Track: **AI & Agent Payments** or **Financial Automation**

### What Stays the Same ✅
- ✅ Database schema (Prisma/PostgreSQL)
- ✅ Virtual balance system architecture
- ✅ Backend API structure (Express controllers/routes)
- ✅ Frontend UI components (Next.js/React)
- ✅ Autonomous agent concept
- ✅ Multi-employer platform design
- ✅ Business logic (payroll, alerts, balance tracking)

### What Needs to Change 🔄
- ❌ SDK: `@mnee/ts-sdk` → **`ethers.js`** or **`viem`**
- ❌ Addresses: Bitcoin format (`tb1q...`) → **Ethereum format (`0x...`)**
- ❌ Wallet: Bitcoin wallets → **MetaMask/WalletConnect**
- ❌ Token standard: Custom → **ERC-20 standard**
- ❌ Smart contracts: sCrypt (Bitcoin) → **Solidity (Ethereum)**

---

## 📦 Package Changes

### Remove
```json
{
  "dependencies": {
    "@mnee/ts-sdk": "^X.X.X"  // REMOVE THIS
  }
}
```

### Add
```json
{
  "dependencies": {
    "ethers": "^6.13.0",           // Ethereum library
    "viem": "^2.21.0",              // Alternative to ethers (optional)
    "wagmi": "^2.12.0",             // React hooks for Ethereum (frontend)
    "@rainbow-me/rainbowkit": "^2.1.0"  // Wallet connection UI (frontend)
  }
}
```

### Installation Commands
```bash
# Backend
cd backend
npm uninstall @mnee/ts-sdk
npm install ethers

# Frontend
cd frontend
npm install ethers wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

---

## 🔑 Environment Variables

### Before (Bitcoin-based)
```env
# OLD - REMOVE THESE
MNEE_RPC_URL=https://testnet.mnee-rpc.io
MNEE_CHAIN_ID=mnee-testnet-1
SALARY_CONTRACT_ADDRESS=0x...  # (Conceptual sCrypt contract)
EMPLOYER_PRIVATE_KEY=L5oLkp...  # WIF format
```

### After (Ethereum-based)
```env
# NEW - ADD THESE

# Ethereum Network (use Sepolia testnet for development)
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_CHAIN_ID=11155111  # Sepolia testnet
# OR for mainnet:
# ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
# ETHEREUM_CHAIN_ID=1

# MNEE Token Contract (ERC-20)
MNEE_TOKEN_ADDRESS=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF

# Platform Wallet (holds custodial funds)
PLATFORM_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
PLATFORM_PRIVATE_KEY=0xac0974bec...  # Ethereum private key (64 hex chars)

# Infura/Alchemy API Keys
INFURA_API_KEY=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key  # Optional alternative

# Frontend (Next.js public vars)
NEXT_PUBLIC_ETHEREUM_CHAIN_ID=11155111
NEXT_PUBLIC_MNEE_TOKEN_ADDRESS=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### Getting API Keys
1. **Infura**: https://infura.io/ (free tier available)
2. **Alchemy**: https://www.alchemy.com/ (alternative to Infura)
3. **WalletConnect**: https://cloud.walletconnect.com/ (for frontend wallet connections)

---

## 🗂️ File-by-File Migration Checklist

### 1. Backend Service Layer

#### **`backend/src/services/mneeService.ts`** → **`backend/src/services/ethereumService.ts`**

**Changes Required**:
- Replace Bitcoin wallet operations with ethers.js
- Implement ERC-20 token transfers (deposit, withdraw, payroll)
- Use MNEE token contract at `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`

**Key Methods**:
```typescript
// OLD (Bitcoin)
async getBalance(walletAddress: string): Promise<number> {
  // Used @mnee/ts-sdk
}

// NEW (Ethereum)
async getMNEEBalance(ethereumAddress: string): Promise<bigint> {
  const contract = new ethers.Contract(MNEE_TOKEN_ADDRESS, ERC20_ABI, provider);
  return await contract.balanceOf(ethereumAddress);
}

async transferMNEE(to: string, amount: bigint): Promise<string> {
  const contract = new ethers.Contract(MNEE_TOKEN_ADDRESS, ERC20_ABI, wallet);
  const tx = await contract.transfer(to, amount);
  await tx.wait();
  return tx.hash;
}
```

**Status**: 🔴 **NEEDS COMPLETE REWRITE**

---

#### **`backend/src/services/balanceService.ts`**

**Changes Required**:
- Import `ethereumService` instead of `mneeService`
- Address format validation (Ethereum addresses are 42 chars starting with `0x`)
- Transaction hash format (Ethereum tx hashes are 66 chars starting with `0x`)

**Status**: 🟡 **MINOR UPDATES** (mostly import changes)

---

### 2. Database & Seed Data

#### **`backend/src/seed.ts`**

**Changes Required**:
```typescript
// OLD
walletAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'  // Bitcoin testnet

// NEW
walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'  // Ethereum address
```

**Test Ethereum Addresses** (for seed data):
```typescript
// Employer
walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

// Employees
'0x70997970C51812dc3A010C7d01b50e0d17dc79C8'  // Alice
'0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'  // Bob
'0x90F79bf6EB2c4f870365E785982E1f101E93b906'  // Carol
```

**Status**: 🟡 **UPDATE ADDRESSES ONLY**

---

#### **`backend/prisma/schema.prisma`**

**Changes Required**:
- Wallet address validation can stay the same (string field)
- No schema changes needed!

**Status**: ✅ **NO CHANGES REQUIRED**

---

### 3. Frontend Wallet Integration

#### **`frontend/lib/store.ts`** (Zustand store)

**Changes Required**:
```typescript
// OLD
connectWallet: async (bitcoinAddress: string) => { ... }

// NEW
connectWallet: async (ethereumAddress: string) => {
  // Use wagmi/RainbowKit instead of manual connection
  set({ walletAddress: ethereumAddress, isConnected: true })
}
```

**Status**: 🟡 **UPDATE WALLET CONNECTION LOGIC**

---

#### **`frontend/app/layout.tsx`** or **`frontend/app/providers.tsx`** (new file)

**Add RainbowKit/Wagmi Setup**:
```typescript
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'MNEE Autonomous Payroll',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia],  // or [mainnet] for production
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Status**: 🔴 **NEW FILE REQUIRED**

---

#### **`frontend/app/page.tsx`** (Landing page)

**Changes Required**:
```typescript
// OLD
<Button onClick={() => connectWallet('mnee1test...')}>
  Connect Bitcoin Wallet
</Button>

// NEW
import { ConnectButton } from '@rainbow-me/rainbowkit';

<ConnectButton />  // This handles MetaMask connection automatically!
```

**Status**: 🟡 **REPLACE WALLET BUTTON**

---

### 4. Controllers (Minimal Changes)

#### **`backend/src/controllers/payrollController.ts`**

**Changes Required**:
- Import `ethereumService` instead of `mneeService`
- Update error messages to reference "Ethereum wallet" instead of "MNEE wallet"

**Status**: 🟢 **IMPORT CHANGES ONLY**

---

#### **`backend/src/controllers/balanceController.ts`**

**Status**: ✅ **NO CHANGES REQUIRED** (already uses balanceService)

---

### 5. Documentation Updates

#### **`CLAUDE.md`**

**Changes Required**:
- Update "MNEE Network" → "Ethereum"
- Update contract deployment instructions
- Update wallet connection examples
- Add MNEE ERC-20 token interaction examples

**Status**: 🟡 **UPDATE PLATFORM REFERENCES**

---

#### **`README.md`**

**Changes Required**:
- Update project description to mention Ethereum
- Update setup instructions (Infura API key, Sepolia testnet)
- Update architecture diagram if applicable

**Status**: 🟡 **UPDATE INTRO & SETUP**

---

## 🧪 Testing Checklist

### Backend Testing
```bash
# 1. Install dependencies
cd backend
npm install ethers

# 2. Update .env with Ethereum config
# (see Environment Variables section above)

# 3. Test Ethereum connection
npm run test:ethereum  # (create this test script)

# 4. Seed database with Ethereum addresses
npm run db:seed

# 5. Start backend
npm run dev

# 6. Test MNEE balance check
curl http://localhost:3001/api/ethereum/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Frontend Testing
```bash
# 1. Install dependencies
cd frontend
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query

# 2. Update .env.local
# (add NEXT_PUBLIC_* variables)

# 3. Start frontend
npm run dev

# 4. Test wallet connection
# - Open http://localhost:3000
# - Click "Connect Wallet"
# - Connect MetaMask (Sepolia testnet)
# - Verify wallet address displayed correctly
```

### Integration Testing
```bash
# Full flow test:
1. Connect MetaMask wallet
2. View virtual balance dashboard
3. Deposit MNEE tokens (approve + transfer)
4. Run test payroll
5. Verify balance deducted
6. Check transaction history
```

---

## 🔐 Security Considerations

### Private Key Management
**CRITICAL**: Ethereum private keys are more sensitive than Bitcoin WIF keys.

```bash
# Generate secure Ethereum wallet (using ethers.js)
npx tsx scripts/generate-eth-wallet.ts

# Output:
# Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Best Practices**:
- ❌ NEVER commit private keys to Git
- ✅ Use `.env` file (already in `.gitignore`)
- ✅ For production: Use AWS Secrets Manager or HashiCorp Vault
- ✅ Use hardware wallets (Ledger) for mainnet

### Smart Contract Security
If implementing custom payroll escrow contract:
- Use OpenZeppelin libraries
- Get contract audited before mainnet
- Test extensively on Sepolia testnet

---

## 📊 MNEE Token Contract Reference

### Contract Address
```
Mainnet: 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
Testnet (Sepolia): [To be confirmed - check hackathon docs]
```

### Standard ERC-20 Methods
```solidity
// Read methods (no gas required)
function balanceOf(address account) external view returns (uint256);
function allowance(address owner, address spender) external view returns (uint256);
function totalSupply() external view returns (uint256);

// Write methods (requires gas + approval)
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
```

### ERC-20 ABI (Minimal)
```json
[
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
]
```

---

## 🚀 Migration Execution Steps

### Phase 1: Backend Foundation (Day 1 - Morning)
```bash
# 1. Install Ethereum dependencies
cd backend
npm uninstall @mnee/ts-sdk
npm install ethers

# 2. Create Ethereum service
# (See backend/src/services/ethereumService.ts below)

# 3. Update seed data
# (Replace Bitcoin addresses with Ethereum addresses)

# 4. Update .env
# (Add Ethereum RPC URL, chain ID, token address)
```

### Phase 2: Service Integration (Day 1 - Afternoon)
```bash
# 1. Update controllers to use ethereumService
# (payrollController.ts, balanceController.ts)

# 2. Test backend endpoints
npm run dev
curl http://localhost:3001/api/ethereum/balance/0x...

# 3. Test database operations
npm run db:seed
npm run db:migrate  # If schema changes needed
```

### Phase 3: Frontend Wallet (Day 2 - Morning)
```bash
# 1. Install frontend dependencies
cd frontend
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query

# 2. Create Providers component
# (See frontend/app/providers.tsx)

# 3. Update landing page wallet button
# (Replace custom button with <ConnectButton />)

# 4. Test MetaMask connection
npm run dev
```

### Phase 4: Token Interactions (Day 2 - Afternoon)
```bash
# 1. Implement deposit flow
# - User approves MNEE token spend
# - Platform transfers MNEE from user to platform wallet
# - Backend updates virtualBalance

# 2. Implement withdraw flow
# - Backend checks virtualBalance
# - Platform transfers MNEE from platform wallet to user
# - Backend updates virtualBalance

# 3. Implement payroll flow
# - Backend checks virtualBalance
# - Platform transfers MNEE from platform wallet to employees
# - Backend deducts from virtualBalance
```

### Phase 5: Testing & Polish (Day 3)
```bash
# 1. End-to-end testing
# - Connect MetaMask
# - Deposit MNEE
# - Run payroll
# - Withdraw MNEE

# 2. Update documentation
# - README.md
# - CLAUDE.md
# - API documentation

# 3. Record demo video
# - Show autonomous agent executing payroll
# - Show virtual balance management
# - Show transaction history
```

---

## 📝 Code Templates

### `backend/src/services/ethereumService.ts`
```typescript
/**
 * Ethereum Service
 * Handles MNEE ERC-20 token interactions on Ethereum
 */

import { ethers } from 'ethers';
import { logger } from '../middleware/logger';

const MNEE_TOKEN_ADDRESS = process.env.MNEE_TOKEN_ADDRESS || '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY!;

// Minimal ERC-20 ABI
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export class EthereumService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private mneeToken: ethers.Contract;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

    // Initialize platform wallet
    this.wallet = new ethers.Wallet(PLATFORM_PRIVATE_KEY, this.provider);

    // Initialize MNEE token contract
    this.mneeToken = new ethers.Contract(MNEE_TOKEN_ADDRESS, ERC20_ABI, this.wallet);

    logger.info('EthereumService initialized', {
      network: ETHEREUM_RPC_URL,
      tokenAddress: MNEE_TOKEN_ADDRESS,
      platformWallet: this.wallet.address
    });
  }

  /**
   * Get MNEE token balance for an address
   */
  async getBalance(address: string): Promise<number> {
    try {
      const balance = await this.mneeToken.balanceOf(address);
      const decimals = await this.mneeToken.decimals();

      // Convert from wei to human-readable (MNEE has 18 decimals like ETH)
      return Number(ethers.formatUnits(balance, decimals));
    } catch (error: any) {
      logger.error('Failed to get MNEE balance', { error: error.message, address });
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Transfer MNEE tokens (for payroll)
   */
  async transferMNEE(
    toAddress: string,
    amount: number,
    description?: string
  ): Promise<string> {
    try {
      const decimals = await this.mneeToken.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Execute transfer
      const tx = await this.mneeToken.transfer(toAddress, amountWei);

      logger.info('MNEE transfer initiated', {
        to: toAddress,
        amount,
        txHash: tx.hash,
        description
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      logger.info('MNEE transfer confirmed', {
        to: toAddress,
        amount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });

      return receipt.hash;
    } catch (error: any) {
      logger.error('MNEE transfer failed', {
        error: error.message,
        to: toAddress,
        amount
      });
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer MNEE from user to platform (deposit)
   * Requires user to approve() first via frontend
   */
  async depositFromUser(
    userAddress: string,
    amount: number
  ): Promise<string> {
    try {
      const decimals = await this.mneeToken.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // Transfer from user to platform wallet
      const tx = await this.mneeToken.transferFrom(
        userAddress,
        this.wallet.address,
        amountWei
      );

      logger.info('Deposit initiated', {
        from: userAddress,
        to: this.wallet.address,
        amount,
        txHash: tx.hash
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      logger.error('Deposit failed', { error: error.message, userAddress, amount });
      throw new Error(`Deposit failed: ${error.message}`);
    }
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }
      return tx;
    } catch (error: any) {
      logger.error('Failed to get transaction', { error: error.message, txHash });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }
}

export const ethereumService = new EthereumService();
```

### `frontend/app/providers.tsx` (NEW FILE)
```typescript
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'MNEE Autonomous Payroll',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia],  // Use mainnet for production
  ssr: true,  // Enable server-side rendering
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### `scripts/generate-eth-wallet.ts` (NEW FILE)
```typescript
/**
 * Generate Ethereum test wallets
 * Usage: npx tsx scripts/generate-eth-wallet.ts
 */

import { ethers } from 'ethers';

console.log('🔐 Generating Ethereum Test Wallets\n');
console.log('='.repeat(60));

// Generate 4 test wallets (1 employer + 3 employees)
for (let i = 1; i <= 4; i++) {
  console.log(`\n📝 Test Wallet ${i}:`);
  console.log('-'.repeat(60));

  const wallet = ethers.Wallet.createRandom();

  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log(`Mnemonic:    ${wallet.mnemonic?.phrase}`);

  console.log(`\n.env entry:`);
  if (i === 1) {
    console.log(`PLATFORM_WALLET_ADDRESS="${wallet.address}"`);
    console.log(`PLATFORM_PRIVATE_KEY="${wallet.privateKey}"`);
  } else {
    console.log(`EMPLOYEE_${i - 1}_ADDRESS="${wallet.address}"`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Done! Copy the .env entries above to your .env file');
console.log('\n⚠️  IMPORTANT: These are TEST wallets - Fund with Sepolia testnet ETH');
console.log('⚠️  Get Sepolia ETH from: https://sepoliafaucet.com/');
console.log('⚠️  Keep private keys SECRET - anyone with the key can spend funds!\n');
```

---

## 🎓 Learning Resources

### Ethereum Basics
- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **Ethereum.org**: https://ethereum.org/en/developers/
- **ERC-20 Standard**: https://eips.ethereum.org/EIPS/eip-20

### Frontend Wallet Integration
- **RainbowKit Docs**: https://www.rainbowkit.com/docs/introduction
- **Wagmi Docs**: https://wagmi.sh/
- **Viem Docs**: https://viem.sh/

### Testing
- **Sepolia Testnet Faucet**: https://sepoliafaucet.com/
- **Sepolia Block Explorer**: https://sepolia.etherscan.io/

### MNEE Hackathon
- **Hackathon Page**: https://mnee-eth.devpost.com/
- **MNEE Token Contract**: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **Requirements**: Use MNEE stablecoin for AI/Agent Payments or Financial Automation

---

## ⚡ Quick Start (After Migration)

```bash
# 1. Generate Ethereum wallets
npx tsx scripts/generate-eth-wallet.ts

# 2. Update .env with generated addresses

# 3. Get Sepolia testnet ETH
# Visit https://sepoliafaucet.com/ and paste your platform wallet address

# 4. Install dependencies
npm install  # Root (installs all workspaces)

# 5. Seed database
cd backend && npm run db:seed

# 6. Start backend
npm run dev

# 7. Start frontend (in new terminal)
cd frontend && npm run dev

# 8. Open browser
# http://localhost:3000

# 9. Connect MetaMask
# - Switch to Sepolia testnet
# - Click "Connect Wallet"
# - Approve connection

# 10. Test deposit
# - Get test MNEE tokens (from hackathon organizers)
# - Approve MNEE spend in MetaMask
# - Deposit to platform

# 11. Run test payroll
# - Navigate to /payroll
# - Click "Run Payroll Now"
# - Verify balance deducted
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to Ethereum network"
**Solution**: Check your Infura/Alchemy API key in `.env`

### Issue: "Transaction failed: insufficient funds"
**Solution**: Get Sepolia ETH from faucet for gas fees

### Issue: "MNEE transfer failed: ERC20InsufficientAllowance"
**Solution**: User needs to call `approve()` before deposit (frontend should handle this)

### Issue: "MetaMask not connecting"
**Solution**:
- Check WalletConnect Project ID
- Ensure frontend is running on http://localhost:3000 (not 127.0.0.1)
- Clear MetaMask cache

### Issue: "Transaction pending forever"
**Solution**: Increase gas price or wait for network congestion to clear

---

## 📋 Migration Completion Checklist

- [ ] Uninstall `@mnee/ts-sdk`, install `ethers.js`
- [ ] Create `ethereumService.ts` with MNEE ERC-20 interactions
- [ ] Update seed data with Ethereum addresses
- [ ] Generate Ethereum test wallets
- [ ] Update `.env` with Ethereum configuration
- [ ] Update controllers to use `ethereumService`
- [ ] Install frontend wallet libraries (wagmi, RainbowKit)
- [ ] Create `Providers` component
- [ ] Replace wallet connection button with `<ConnectButton />`
- [ ] Test MetaMask connection
- [ ] Test MNEE balance check
- [ ] Test MNEE deposit (approve + transferFrom)
- [ ] Test payroll execution
- [ ] Test withdrawal
- [ ] Update `CLAUDE.md` with Ethereum instructions
- [ ] Update `README.md` with new setup steps
- [ ] Record demo video
- [ ] Submit to hackathon!

---

## 🎉 Hackathon Submission Tips

### Demo Video (Required)
Show the following in your demo:
1. **Problem**: Manual payroll is error-prone and time-consuming
2. **Solution**: Autonomous AI agent executes payroll automatically
3. **Tech Demo**:
   - Connect MetaMask wallet
   - View virtual MNEE balance
   - Add employees with wallet addresses
   - Run autonomous payroll (AI checks schedule, executes transfers)
   - Show transaction history
4. **Impact**: Saves time, reduces errors, enables programmable money

### Project Description
**Suggested Title**: "MNEE Autonomous Payroll - AI Agent for Automated Salary Payments"

**Track**: AI & Agent Payments

**One-Liner**: An autonomous AI agent that executes employee salary payments in MNEE stablecoin on schedule, with multi-employer support and virtual balance management.

**Tech Stack**:
- Blockchain: Ethereum (Sepolia)
- Token: MNEE ERC-20 Stablecoin
- Smart Contract: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL
- Frontend: Next.js 14, React, TailwindCSS, RainbowKit
- Agent: MNEE Agent Runtime (conceptual - autonomous execution)

### Judging Criteria
- **Innovation**: Autonomous agent + programmable money
- **Technical Implementation**: Full-stack with ERC-20 integration
- **Use of MNEE**: Core feature (all payments in MNEE stablecoin)
- **Potential Impact**: Scales to multiple employers/employees

---

## 📞 Support & Questions

If you encounter issues during migration:
1. Check this document's "Common Issues" section
2. Review Ethereum service logs: `tail -f backend/logs/combined.log`
3. Test each component independently
4. Ask on MNEE hackathon Discord/Telegram

---

**Last Updated**: November 24, 2025
**Migration Status**: 🚧 In Progress
**Estimated Completion**: Day 2-3 of development

**Good luck with the hackathon! 🚀**
