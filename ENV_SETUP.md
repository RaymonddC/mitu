# Environment Configuration Guide

This project supports **environment-specific configuration** to easily switch between testnet (Sepolia) and mainnet (Ethereum) deployments.

## 📁 Environment Files

### Backend (`backend/`)
- **`.env.development`** - Sepolia testnet configuration (for development)
- **`.env.production`** - Ethereum mainnet configuration (for production)
- **`.env`** - ⚠️ **Legacy file** - kept for backwards compatibility, but **not used by npm scripts**

### Frontend (`frontend/`)
- **`.env.development`** - Sepolia testnet configuration (for development)
- **`.env.production`** - Ethereum mainnet configuration (for production)
- **`.env.local`** - ⚠️ **Legacy file** - kept for backwards compatibility, but **not used by npm scripts**

## 🚀 How to Switch Environments

### Development Mode (Testnet - Sepolia)

**Start Backend:**
```bash
cd backend
npm run dev
# Uses .env.development automatically
```

**Start Frontend:**
```bash
cd frontend
npm run dev
# Uses .env.development automatically
```

**Run Database Migrations:**
```bash
cd backend
npm run db:migrate
# Uses .env.development automatically
```

**Seed Database:**
```bash
cd backend
npm run db:seed
# Uses .env.development automatically
```

### Production Mode (Mainnet - Ethereum)

**⚠️ IMPORTANT: Update `.env.production` files first!**

Before running in production mode:
1. Update `backend/.env.production` with your production database URL
2. Update `backend/.env.production` with mainnet Infura/Alchemy key
3. Update `frontend/.env.production` with your production API URL
4. Deploy SimpleBatchTransfer.sol to mainnet and update contract address
5. Generate secure JWT_SECRET and SESSION_SECRET (use `openssl rand -base64 32`)

**Test Production Locally:**
```bash
cd backend
npm run dev:prod
# Uses .env.production for testing mainnet configuration locally
```

**Build for Production:**
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
# Uses .env.production automatically
```

**Run Production:**
```bash
# Backend
cd backend
npm run start
# Uses .env.production automatically via NODE_ENV=production

# Frontend
cd frontend
npm run start
# Next.js will use .env.production
```

**Run Database Migrations (Production):**
```bash
cd backend
npm run db:migrate:prod
# Uses .env.production - runs non-interactive migrate deploy
```

## 🔄 Environment Variable Loading Order

### Backend
1. **npm scripts** use `dotenv-cli` to load environment-specific files:
   - `npm run dev` → loads `.env.development`
   - `npm run dev:prod` → loads `.env.production`
   - `npm run start` → `server.ts` detects `NODE_ENV=production` and loads `.env.production`

2. **Fallback behavior** in `server.ts`:
   - Checks `NODE_ENV` variable
   - Loads `.env.production` if `NODE_ENV=production`
   - Loads `.env.development` if `NODE_ENV=development` or not set
   - Falls back to `.env` if environment-specific file doesn't exist

### Frontend (Next.js)
Next.js automatically loads environment files based on the command:
- `npm run dev` → loads `.env.development`
- `npm run build` → loads `.env.production`
- `npm run start` → uses variables from build time (`.env.production`)

## ⚙️ Configuration Checklist

### Before Deploying to Production

Backend (`.env.production`):
- [ ] Update `DATABASE_URL` to production database
- [ ] Update `ETHEREUM_RPC_URL` to mainnet Infura/Alchemy (with production API key)
- [ ] Set `ETHEREUM_CHAIN_ID=1` (Ethereum mainnet)
- [ ] Set `MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"` (mainnet MNEE)
- [ ] Set `MOCK_MODE=false`
- [ ] Generate new `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Generate new `SESSION_SECRET` (use `openssl rand -base64 32`)
- [ ] Update `CORS_ORIGIN` to production frontend URL
- [ ] Add `SENTRY_DSN` for production monitoring (recommended)

Frontend (`.env.production`):
- [ ] Update `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Set `NEXT_PUBLIC_ETHEREUM_CHAIN_ID=1` (Ethereum mainnet)
- [ ] Set `NEXT_PUBLIC_MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"`
- [ ] Deploy SimpleBatchTransfer.sol to mainnet: `cd contracts && npx hardhat run scripts/deploy-batch-v2.ts --network mainnet`
- [ ] Update `NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS` with deployed mainnet address
- [ ] Get production WalletConnect Project ID from https://cloud.walletconnect.com/
- [ ] Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## 🛠️ Troubleshooting

### "dotenv-cli: command not found"
Run:
```bash
cd backend
npm install
```
This installs `dotenv-cli` as a dev dependency.

### "Environment variable not loading"
1. Check that you're using the correct npm script (`npm run dev`, not `tsx src/server.ts`)
2. Verify the `.env.development` or `.env.production` file exists
3. Check file permissions (`chmod 644 backend/.env.development`)

### "Still using old .env values"
The old `backend/.env` and `frontend/.env.local` files are **kept for backwards compatibility** but are **NOT used** when running via npm scripts. To fully switch:
1. Ensure you're running via `npm run dev` (not direct execution)
2. Restart your terminal/IDE to clear old environment variables
3. The root `.env` has been deleted to avoid confusion

### "Frontend not picking up production values"
Next.js builds the frontend with environment variables **baked in at build time**:
1. Make sure `.env.production` is updated **before** running `npm run build`
2. Rebuild the frontend: `cd frontend && npm run build`
3. Environment variables are NOT loaded at runtime for `NEXT_PUBLIC_*` variables

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [dotenv-cli Documentation](https://github.com/entropitor/dotenv-cli)
- [MNEE Hackathon](https://mnee-eth.devpost.com/)
- [Infura Dashboard](https://infura.io/dashboard)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)

## 🔒 Security Best Practices

1. **NEVER commit `.env.development` or `.env.production`** - they contain secrets
2. **Use `.env.example`** as a template for new developers
3. **In production**, use secrets managers:
   - Vercel: Environment Variables in dashboard
   - Railway: Variables in settings
   - AWS: AWS Secrets Manager
   - Docker: Docker secrets or env files with restricted permissions
4. **Rotate secrets regularly** (JWT_SECRET, API keys, database passwords)
5. **Use different API keys** for development and production
6. **Monitor your Infura/Alchemy usage** to detect unauthorized access

---

**Environment file status:**
- ✅ `backend/.env` - Unchanged (kept as fallback)
- ✅ `frontend/.env.local` - Unchanged (kept as fallback)
- 🗑️ **Root `.env`** - Deleted (was outdated and not used)

**You're now using the new environment-specific files (`.env.development` and `.env.production`) exclusively via npm scripts!**
