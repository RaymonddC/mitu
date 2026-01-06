# Production Deployment Checklist

Complete guide for deploying MNEE Autonomous Payroll to production.

---

## ✅ Pre-Deployment Checklist

### 1. Environment Files

- [ ] Created `backend/.env.production` from template
- [ ] Created `frontend/.env.local` with production values
- [ ] Generated strong JWT_SECRET: `openssl rand -base64 32`
- [ ] Generated strong SESSION_SECRET: `openssl rand -base64 32`
- [ ] All sensitive values are unique (not copied from dev)
- [ ] `.env*` files are in `.gitignore`

### 2. API Keys & Services

- [ ] **Infura/Alchemy**: Production API key for Ethereum mainnet
- [ ] **WalletConnect**: Project ID from cloud.walletconnect.com
- [ ] **Database**: Production PostgreSQL database provisioned
- [ ] **Domain**: Domain name purchased (optional but recommended)
- [ ] **SSL Certificate**: HTTPS enabled on hosting platform

### 3. Smart Contracts (Optional)

- [ ] **SimpleBatchTransfer.sol** deployed to Ethereum mainnet
  - Follow: `contracts/DEPLOY_V2_GUIDE.md`
- [ ] Contract verified on Etherscan
- [ ] Contract address saved and added to environment variables
- [ ] Tested batch approval flow on mainnet

### 4. Database Setup

- [ ] Production database created (Railway, Supabase, Render, etc.)
- [ ] Database connection string obtained
- [ ] Database SSL enabled
- [ ] Backup strategy configured
- [ ] Migration scripts tested

### 5. Code Review

- [ ] All console.logs removed or replaced with Winston logging
- [ ] No hardcoded secrets in code
- [ ] Error handling for all critical paths
- [ ] Rate limiting configured
- [ ] CORS settings configured for production domain

---

## 🚀 Deployment Steps

### Step 1: Database Deployment

**Option A: Railway**
```bash
# Create Railway project
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Get connection string
railway variables
# Copy DATABASE_URL
```

**Option B: Supabase**
1. Go to https://supabase.com/
2. Create new project
3. Copy connection string from Settings → Database
4. Use "Pooler" connection string for better performance

**Option C: Render**
1. Create PostgreSQL database at https://render.com/
2. Copy Internal Database URL
3. Note: External URL costs extra

### Step 2: Backend Deployment

**Railway (Recommended)**

```bash
cd backend

# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project (if created above)
railway link

# Set environment variables
railway variables set ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
railway variables set ETHEREUM_CHAIN_ID=1
railway variables set MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"
railway variables set JWT_SECRET="YOUR_GENERATED_SECRET"
railway variables set SESSION_SECRET="YOUR_GENERATED_SECRET"
railway variables set NODE_ENV="production"
# Add all other variables from .env.production

# Deploy
railway up

# Run migrations
railway run npm run db:migrate:prod

# Get deployment URL
railway domain
# Example: backend-production-xxxx.up.railway.app
```

**Render**

1. Go to https://render.com/
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `npm install && npm run build && npm run db:migrate:prod`
   - Start Command: `npm start`
   - Environment: `Node`
5. Add environment variables (all from `.env.production`)
6. Deploy

**Fly.io**

```bash
cd backend

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Set secrets
fly secrets set ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
fly secrets set DATABASE_URL="your_db_url"
# ... set all environment variables

# Deploy
fly deploy

# Run migrations
fly ssh console
npm run db:migrate:prod
exit
```

### Step 3: Frontend Deployment

**Vercel (Recommended)**

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Or via web dashboard:
# 1. Go to vercel.com
# 2. Import Git repository
# 3. Framework Preset: Next.js
# 4. Build Command: npm run build
# 5. Output Directory: .next
```

**Environment Variables in Vercel Dashboard:**

1. Go to Project Settings → Environment Variables
2. Add the following for **Production**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_ETHEREUM_CHAIN_ID=1
   NEXT_PUBLIC_MNEE_TOKEN_ADDRESS=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
   NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS=0xYourDeployedContract
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
   ```
3. Redeploy: Settings → Deployments → Redeploy

**Netlify**

```bash
cd frontend

# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variables via dashboard
# Site Settings → Environment Variables
```

### Step 4: Docker Compose (Self-Hosted)

If you prefer self-hosting on a VPS:

```bash
# On your server (Ubuntu/Debian)

# 1. Clone repository
git clone https://github.com/yourusername/mnee-payroll.git
cd mnee-payroll

# 2. Create production environment files
cp .env.example .env
nano .env  # Edit with production values

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Install Docker Compose
sudo apt install docker-compose

# 5. Build and start services
docker-compose up -d

# 6. Check logs
docker-compose logs -f

# 7. Run migrations
docker-compose exec backend npm run db:migrate:prod

# 8. Set up nginx reverse proxy (optional)
# See: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
```

---

## 🧪 Post-Deployment Testing

### 1. Backend Health Check

```bash
# Test API endpoint
curl https://your-backend.railway.app/health

# Expected response:
{"status":"ok","timestamp":"2024-..."}
```

### 2. Frontend Check

1. Visit your frontend URL: `https://your-app.vercel.app`
2. Check browser console for errors
3. Try connecting MetaMask wallet
4. Verify network is set to Ethereum mainnet

### 3. Database Check

```bash
# On Railway
railway run npx prisma studio

# Or connect with psql
psql $DATABASE_URL
\dt  # List tables
SELECT COUNT(*) FROM employers;
```

### 4. End-to-End Test

1. **Connect Wallet**: MetaMask on Ethereum mainnet
2. **Create Company**: Add company name and logo
3. **Add Employee**: Test with a real Ethereum address
4. **Run Payroll**: Test batch transfer (use small amount!)
5. **Verify on Etherscan**: Check transaction appeared
6. **Check Dashboard**: Verify transaction history shows up

---

## 🔒 Security Hardening

### 1. Environment Variables

- [ ] All secrets are in environment variables, not code
- [ ] No `.env` files committed to git
- [ ] Production secrets different from development
- [ ] Database connection uses SSL

### 2. API Security

- [ ] Rate limiting enabled (express-rate-limit)
- [ ] CORS configured for production domain only
- [ ] Helmet middleware enabled
- [ ] No verbose error messages in production

### 3. Database Security

- [ ] Database not publicly accessible
- [ ] Strong database password
- [ ] Regular backups configured
- [ ] Read replicas for scaling (optional)

### 4. Monitoring

- [ ] Error tracking (Sentry, LogRocket, etc.)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Log aggregation (Datadog, LogDNA)
- [ ] RPC usage monitoring (Infura/Alchemy dashboard)

---

## 📊 Monitoring Setup (Optional)

### Sentry (Error Tracking)

```bash
# Install
npm install @sentry/node @sentry/nextjs

# Backend: src/server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

# Frontend: next.config.js
module.exports = {
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
};
```

### UptimeRobot (Uptime Monitoring)

1. Go to https://uptimerobot.com/
2. Add new monitor
3. URL: `https://your-backend.railway.app/health`
4. Type: HTTP(S)
5. Interval: 5 minutes
6. Set alert contacts (email, Slack, etc.)

---

## 🔄 Continuous Deployment (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build --workspace=backend
      - uses: railwayapp/cli@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          command: up

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build --workspace=frontend
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🆘 Troubleshooting

### Backend won't start

**Check logs:**
```bash
# Railway
railway logs

# Render
# View logs in dashboard

# Docker
docker-compose logs backend
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Wrong Node.js version

### Frontend shows connection error

**Check:**
- `NEXT_PUBLIC_API_URL` is correct
- Backend is actually running
- CORS settings allow your frontend domain
- Browser console for specific errors

### Payroll transaction fails

**Check:**
- User has MNEE tokens in wallet
- User is on correct network (mainnet)
- Batch contract is deployed (if using batch)
- User approved batch contract (if using batch)
- Sufficient ETH for gas fees

### Database migration fails

**Check:**
- Database is accessible
- Connection string is correct
- User has CREATE TABLE permissions
- No conflicting migrations

---

## 📈 Scaling Considerations

When you grow beyond MVP:

### Database
- [ ] Enable connection pooling (PgBouncer)
- [ ] Add read replicas for queries
- [ ] Implement caching (Redis)
- [ ] Regular backups and restore testing

### Backend
- [ ] Horizontal scaling (multiple instances)
- [ ] Load balancer (Railway/Render handles this)
- [ ] CDN for static assets
- [ ] Rate limiting per user

### Frontend
- [ ] Enable Vercel Edge Network
- [ ] Optimize images (next/image)
- [ ] Code splitting
- [ ] Service worker for offline support

### Blockchain
- [ ] RPC failover (multiple providers)
- [ ] Transaction queue system
- [ ] Gas price optimization
- [ ] Archive node for historical data

---

## ✅ Deployment Complete!

Your MNEE Autonomous Payroll platform is now live on production! 🎉

**Next steps:**
1. Test thoroughly with small amounts
2. Monitor logs for first 24 hours
3. Set up alerts for errors
4. Prepare customer support flow
5. Document known issues and workarounds

**Production URLs to save:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app`
- Database: `postgresql://...` (keep secret!)
- Batch Contract: `0x...` (on Etherscan)

Good luck! 🚀
