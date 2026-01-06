# SimpleBatchTransfer Deployment Guide

## Quick Deploy (5 minutes)

### Option 1: Deploy via Remix (Easiest - Recommended)

1. **Open Remix IDE**: https://remix.ethereum.org/

2. **Create new file**: `SimpleBatchTransfer.sol`

3. **Copy contract code** from `contracts/src/SimpleBatchTransfer.sol`

4. **Compile**:
   - Click "Solidity Compiler" tab
   - Select compiler version: `0.8.0+`
   - Click "Compile SimpleBatchTransfer.sol"

5. **Deploy**:
   - Click "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - Network: Switch MetaMask to **Sepolia**
   - Click "Deploy"
   - Confirm in MetaMask (~$15-20 gas)

6. **Copy contract address**:
   - After deployment, copy the contract address
   - Add to `.env`: `BATCH_TRANSFER_CONTRACT_ADDRESS="0x..."`
   - Add to `frontend/.env.local`: `NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS="0x..."`

7. **Done!** ✅

---

### Option 2: Deploy via Script (Advanced)

```bash
# Install dependencies
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox ethers

# Create hardhat.config.ts (or use provided one)

# Deploy
npx hardhat run scripts/deploy-batch-transfer.ts --network sepolia
```

---

## After Deployment

### 1. Update Environment Variables

Add to `.env`:
```bash
BATCH_TRANSFER_CONTRACT_ADDRESS="0xYourContractAddress"
```

Add to `frontend/.env.local`:
```bash
NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS="0xYourContractAddress"
```

### 2. Restart Services

```bash
# Restart backend
npm run dev

# Restart frontend (in another terminal)
cd frontend && npm run dev
```

### 3. Enable Batch Mode in UI

1. Go to dashboard
2. You'll see a toggle: "Use Batch Transfers"
3. Toggle ON
4. See cost comparison!

---

## Contract Details

**Contract**: SimpleBatchTransfer
**Size**: ~35 lines
**Gas Cost**: ~$15-20 to deploy (Sepolia testnet)
**Function**: `batchTransfer(address token, address[] recipients, uint256[] amounts)`

**Security**:
- ✅ Stateless (no storage)
- ✅ No access control needed (uses transferFrom)
- ✅ Gas limit protection (max 200 recipients)
- ✅ Input validation

---

## Verify Contract (Optional)

After deployment, verify on Etherscan:

1. Go to: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Select:
   - Compiler: 0.8.x
   - License: MIT
   - Optimization: Yes
5. Paste contract code
6. Verify

---

## Cost Savings

| Employees | Individual | Batch | Savings/month |
|-----------|-----------|-------|---------------|
| 3         | $7.80     | $5.00 | $2.80 (36%)   |
| 10        | $26.00    | $8.00 | $18.00 (69%)  |
| 50        | $130.00   | $32.00| $98.00 (75%)  |

**Deployment cost**: $15-20 (one-time)
**Break-even** (3 employees): 7 months

---

## Troubleshooting

**"Insufficient funds"**: Get Sepolia ETH from https://sepoliafaucet.com/

**"Contract not found"**: Wait 30 seconds after deployment, then check Etherscan

**"Transaction failed"**: Increase gas limit in MetaMask

---

Need help? Check the deployment logs or ask for assistance!
