# Quick Deployment Guide - Batch Contract V2

## Option 1: Deploy with Remix (Easiest) ⭐

### Step 1: Open Remix IDE
1. Go to https://remix.ethereum.org/
2. Create new file: `SimpleBatchTransfer.sol`

### Step 2: Copy Contract Code
Copy the entire content from:
`/contracts/src/SimpleBatchTransfer.sol`

Paste into Remix.

### Step 3: Compile
1. Click "Solidity Compiler" tab (left sidebar)
2. Select compiler version: `0.8.20` or higher
3. Click "Compile SimpleBatchTransfer.sol"
4. ✅ Should see green checkmark

### Step 4: Deploy
1. Click "Deploy & Run Transactions" tab
2. **IMPORTANT**: Change environment to "Injected Provider - MetaMask"
3. MetaMask will popup - connect your wallet
4. Make sure you're on **Sepolia Testnet**
5. Click "Deploy" button
6. Confirm transaction in MetaMask (~$0.50-1)
7. Wait for confirmation

### Step 5: Copy Contract Address
After deployment:
1. Look in Remix console for "deployed contracts"
2. Copy the address (starts with `0x...`)
3. Example: `0xa3bBB8F74a548dfd13aB5c05Bc5c328cA087ABC7`

### Step 6: Update Frontend
Edit `frontend/.env.local`:

```bash
NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS="0xYourNewContractAddress"
```

### Step 7: Restart Frontend
```bash
cd frontend
# Kill dev server (Ctrl+C)
npm run dev
```

### Step 8: Re-Approve for Users
**IMPORTANT**: Old approval won't work!

Each user must:
1. Go to `/settings`
2. Click "Enable Batch Transfers"
3. Approve in MetaMask

## Option 2: Deploy with Hardhat (Advanced)

### Prerequisites
```bash
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Create hardhat.config.ts
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
```

### Deploy
```bash
npx hardhat run scripts/deploy-batch-v2.ts --network sepolia
```

## Verify on Etherscan (Optional but Recommended)

### Using Remix
1. Go to https://sepolia.etherscan.io/
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select:
   - Compiler: `v0.8.20+commit.xxx`
   - Optimization: No
   - License: MIT
6. Paste your contract code
7. Verify

### Using Hardhat
```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## Testing the Deployment

### 1. Check Contract on Etherscan
Visit: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

Should show:
- ✅ Contract deployed
- ✅ Balance: 0 ETH
- ✅ "Contract" tab visible

### 2. Test Read Function
On Etherscan "Read Contract" tab:
- Call `estimateGasSavings(10)`
- Should return `69` (69% savings for 10 employees)

### 3. Test Frontend Detection
```bash
cd frontend
npm run dev
```

Navigate to `/settings`:
- Should show "Batch Transfers" section
- Should NOT show "Batch transfers not available"

### 4. Test Approval Flow
1. Go to `/settings`
2. Click "Enable Batch Transfers"
3. MetaMask popup appears
4. Approve (~$1-2)
5. Status changes to "Active"

### 5. Test Batch Transfer
1. Create payroll with 2+ employees
2. Click "Approve with Wallet"
3. See confirmation dialog
4. Click "Confirm & Sign with MetaMask"
5. **CHECK METAMASK**:
   - Should show `totalAmount: 20000000000000000000`
   - Much better than old `15` display!

## Troubleshooting

### "Transaction Reverted"
- Check you have Sepolia ETH for gas
- Get testnet ETH: https://sepoliafaucet.com/

### "Contract Not Found"
- Wait 1-2 minutes after deployment
- Etherscan may be slow to index

### "Wrong Network"
- Switch MetaMask to Sepolia Testnet
- Chain ID should be: `11155111`

### Frontend Shows Old Behavior
- Did you update `.env.local`?
- Did you restart dev server?
- Try hard refresh: Ctrl+Shift+R

### Approval Not Working
- Using new contract address?
- Sufficient testnet ETH for gas?
- Already approved? (Can't approve twice)

## Rollback if Needed

If V2 has issues:

```bash
# In frontend/.env.local, revert to old address:
NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS="0xcC80E3fB6b0084e8e45A30A7a6Beb0AE2b0cfBFE"

# Restart frontend
npm run dev
```

Old approvals will work again!

## Summary

✅ **Deployed**: SimpleBatchTransfer V2
✅ **MetaMask**: Now shows total amount clearly
✅ **Testing**: All functions work
✅ **Frontend**: Updated environment variable
✅ **Users**: Can re-approve for better UX

🎉 **Success**: MetaMask now shows correct total!
