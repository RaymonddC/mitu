# Environment Variables Cleanup Guide

## 🔐 Security Update: Remove Custodial Wallet Credentials

Since the platform now uses **non-custodial wallet signing only**, you should remove the platform wallet credentials from your `.env` file.

---

## ✅ **What to Remove from `.env`**

Open your `backend/.env` file and **DELETE** these lines:

```bash
# ❌ REMOVE THESE (no longer needed):
PLATFORM_WALLET_ADDRESS="0xfc51d3F84d9795D9CB40d135D3FD7068371D42fc"
PLATFORM_PRIVATE_KEY="your_private_key_here"
```

**Why remove them?**
- ✅ Platform never needs private keys in non-custodial mode
- ✅ Reduces security risk (no keys to steal)
- ✅ Prevents accidental custodial mode usage
- ✅ Clean architecture

---

## ✅ **What to Keep in `.env`**

These variables are **REQUIRED**:

### **Backend (`backend/.env`):**

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mnee_payroll?schema=public"

# Ethereum Network
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
ETHEREUM_CHAIN_ID=11155111

# MNEE Token Contract (NOT a wallet - this is the ERC-20 contract)
MNEE_TOKEN_ADDRESS="0x41557BA6e63f431788a6Ea1989C3FeF390c8Ab76"

# Backend Config
PORT=3001
NODE_ENV="development"
JWT_SECRET="your-secret-here"
SESSION_SECRET="another-secret-here"
```

### **Frontend (`frontend/.env.local`):**

```bash
# API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Ethereum Network (must match backend)
NEXT_PUBLIC_ETHEREUM_CHAIN_ID=11155111

# MNEE Token Contract (must match backend)
NEXT_PUBLIC_MNEE_TOKEN_ADDRESS="0x41557BA6e63f431788a6Ea1989C3FeF390c8Ab76"

# WalletConnect (optional but recommended)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"
```

---

## 📋 **Verification Checklist**

After updating your `.env` file:

- [ ] ✅ Removed `PLATFORM_WALLET_ADDRESS`
- [ ] ✅ Removed `PLATFORM_PRIVATE_KEY`
- [ ] ✅ Kept `MNEE_TOKEN_ADDRESS` (this is the token contract, not a wallet)
- [ ] ✅ Kept `DATABASE_URL`
- [ ] ✅ Kept `ETHEREUM_RPC_URL` and `ETHEREUM_CHAIN_ID`
- [ ] ✅ Updated `.env.local` in frontend folder

---

## 🔍 **Understanding the Difference**

### **Token Contract Address (KEEP):**
```bash
MNEE_TOKEN_ADDRESS="0x41557BA6e63f431788a6Ea1989C3FeF390c8Ab76"
```
- ✅ This is an **ERC-20 smart contract** address
- ✅ It's public information (safe to share)
- ✅ Tells the system which token to interact with
- ✅ **REQUIRED** for wallet signing to work

### **Platform Wallet (REMOVE):**
```bash
PLATFORM_WALLET_ADDRESS="0xfc51..."  # ❌ DELETE
PLATFORM_PRIVATE_KEY="0x123..."      # ❌ DELETE
```
- ❌ These were for **custodial mode** (removed)
- ❌ Private key = security risk
- ❌ No longer used in non-custodial architecture
- ❌ **NOT NEEDED** - users sign with their own wallets

---

## 🚀 **After Cleanup**

1. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check logs:**
   - You should see: `"EthereumService in MOCK MODE (expected for non-custodial architecture)"`
   - This is **NORMAL** and **CORRECT** ✅

3. **Test the flow:**
   - Connect wallet → Create payroll approval → Sign in MetaMask
   - Everything works without platform wallet credentials!

---

## ⚠️ **What If I Kept the Variables?**

If you leave `PLATFORM_PRIVATE_KEY` in `.env`:
- ⚠️ Security risk (unnecessary key exposure)
- ⚠️ Confusion about architecture
- ⚠️ System still works (just ignores them)

**Best practice:** Remove them for clean, secure architecture.

---

## 🎯 **Summary**

**Before (Custodial):**
```
Platform holds funds → Platform signs transactions
```

**After (Non-Custodial):**
```
Employer holds funds → Employer signs transactions via MetaMask
```

**Platform needs:**
- ✅ Token contract address (to know which token)
- ✅ RPC URL (to read blockchain)
- ❌ Private keys (users sign, not platform)

---

## 📞 **Need Help?**

If something breaks after cleanup:
1. Check backend logs for errors
2. Verify `MNEE_TOKEN_ADDRESS` matches frontend
3. Ensure `ETHEREUM_RPC_URL` is valid
4. Confirm MetaMask is on Sepolia testnet

**Everything should work WITHOUT platform wallet credentials!**
