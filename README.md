# MNEE Autonomous Payroll Agent

> **Hackathon Project**: Fully autonomous, Ethereum-native payroll system powered by MNEE ERC-20 stablecoin

[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA)](https://sepolia.etherscan.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![MNEE Token](https://img.shields.io/badge/MNEE-ERC--20-1B5BF9)](https://etherscan.io/token/0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Demo Script](#demo-script)
- [Deployment](#deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Hackathon Pitch](#hackathon-pitch)
- [Future Roadmap](#future-roadmap)

---

## 🎯 Overview

The **MNEE Autonomous Payroll Agent** is a production-ready MVP that automates employee salary payments using **Ethereum blockchain** and the **MNEE ERC-20 stablecoin**.

### What it does:

1. **Employers** register with MetaMask and add employees with Ethereum addresses and salary amounts
2. **Autonomous Agent** runs daily, checking if it's payday for any employer
3. **Smart Contracts** execute MNEE token transfers with built-in safety checks
4. **AI Guard** prevents errors (insufficient funds, invalid wallets, suspicious changes)
5. **Full Audit Trail** stores transaction history on-chain + database for transparency

### Why it matters:

- **Eliminates manual payroll** → Set it and forget it
- **100% transparent** → Every transaction on Ethereum blockchain
- **Secure by design** → AI-powered checks before every payment
- **Multi-employer platform** → Virtual balance system supports multiple companies

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend (Next.js)"]
        UI[Dashboard + Employees + Payroll Pages]
        Wallet[MetaMask + RainbowKit]
    end

    subgraph Backend["⚙️ Backend (Node.js + Express)"]
        API[REST API]
        DB[(PostgreSQL)]
        EthService[Ethereum Service<br/>ethers.js]
    end

    subgraph Ethereum["⛓️ Ethereum Network"]
        MNEE[MNEE ERC-20 Token<br/>0x8cce...D6cF]
        Agent[🤖 Autonomous Agent<br/>salary_agent.ts]
        Blockchain[Sepolia Testnet]
    end

    UI -->|API Calls| API
    Wallet -->|Connect via RainbowKit| UI
    API -->|Store/Query| DB
    API -->|ERC-20 Operations| EthService
    EthService -->|Transfer MNEE| MNEE

    Agent -->|Daily Check| API
    Agent -->|Read Schedule| DB
    Agent -->|Execute Payroll| EthService

    MNEE -->|On-chain Events| Blockchain
    Blockchain -->|Confirmed TX| API

    style Frontend fill:#1B5BF9,stroke:#fff,color:#fff
    style Backend fill:#111827,stroke:#fff,color:#fff
    style Ethereum fill:#627EEA,stroke:#fff,color:#fff
```

### Component Flow:

1. **Employer** connects MetaMask wallet → adds employees via frontend
2. **Backend** stores employee data + schedules in PostgreSQL
3. **Autonomous Agent** (conceptual MNEE Agent Runtime implementation):
   - Checks daily if it's payday for any employer
   - Validates balances via Ethereum Service
   - Executes MNEE token transfers for each employee
   - Retries failures, creates alerts
4. **Ethereum Service** (ethers.js v6):
   - Validates employer/employee Ethereum addresses
   - Checks virtual balance sufficiency
   - Transfers MNEE ERC-20 tokens
   - Emits transaction events for audit trail
5. **Frontend** displays:
   - Real-time payroll status
   - Transaction history with Etherscan links
   - AI agent alerts and recommendations

---

## ✨ Features

### Core MVP Features

- ✅ **Employer Onboarding**: Connect MetaMask wallet, set up company profile
- ✅ **Employee Management**: Add/edit/deactivate employees with Ethereum addresses
- ✅ **Payroll Scheduling**: Configure payday (1-28 of month)
- ✅ **Autonomous Execution**: Agent runs daily, executes due payroll automatically
- ✅ **Manual Override**: "Run Payroll Now" button for immediate execution
- ✅ **Virtual Balance System**: Multi-employer custodial platform with instant deposits/withdrawals
- ✅ **AI Guard Checks**:
  - Insufficient balance detection
  - Invalid Ethereum address validation
  - Suspicious salary change alerts (>50% change)
  - Monthly budget cap enforcement
- ✅ **Audit Trail**: Full transaction history with Etherscan tx hashes
- ✅ **Test Mode**: Simulate transactions without blockchain execution

### Security Features

- 🔒 Private key stored in `.env` (never committed)
- 🔒 Idempotency keys prevent duplicate payments
- 🔒 Retry logic with max attempts (3)
- 🔒 Signed audit logs with tx metadata
- 🔒 Rate limiting on API endpoints
- 🔒 Input validation with Zod schemas
- 🔒 Mock mode for safe development without private keys

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + shadcn/ui components
- **State**: Zustand
- **Wallet**: RainbowKit + wagmi + viem
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Blockchain**: ethers.js v6
- **Language**: TypeScript

### Blockchain
- **Network**: Ethereum Sepolia Testnet (development) / Mainnet (production)
- **Token**: MNEE ERC-20 Stablecoin (0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF)
- **RPC Provider**: Infura / Alchemy
- **Agent**: Autonomous agent (conceptual implementation ready for MNEE Agent Runtime)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Version Control**: Git

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **pnpm**
- **Docker** (optional, for containerized setup)
- **Git**
- **MetaMask** browser extension
- **Infura Account** ([Free tier](https://infura.io/)) or Alchemy
- **WalletConnect Project ID** ([Free](https://cloud.walletconnect.com/))
- **Sepolia ETH** from faucet ([Get from](https://sepoliafaucet.com/))
- **MNEE Tokens** from hackathon organizers

---

## 🚀 Quick Start

### Option 1: Local Development (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/mnee-autonomous-payroll.git
cd mnee-autonomous-payroll

# 2. Install dependencies (monorepo)
npm install

# 3. Generate Ethereum wallets for testing
npx tsx scripts/generate-eth-wallets.ts
# Copy the output addresses

# 4. Copy environment template
cp .env.example backend/.env

# 5. Edit backend/.env and add:
#    - Your Infura API key
#    - Generated platform wallet address & private key
#    - MNEE token address (already filled)
nano backend/.env

# 6. Create frontend env file
cp .env.example frontend/.env.local
# Add your WalletConnect Project ID
nano frontend/.env.local

# 7. Start PostgreSQL (via Docker)
docker run --name mnee-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine

# 8. Run database migrations + seed data
cd backend
npm run db:migrate
npm run db:seed

# 9. Start backend + frontend (from root)
cd ..
npm run dev

# 10. Open browser
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
```

### Option 2: Docker Compose

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/mnee-autonomous-payroll.git
cd mnee-autonomous-payroll

# 2. Generate wallets
npx tsx scripts/generate-eth-wallets.ts

# 3. Copy and edit environment files
cp .env.example backend/.env
cp .env.example frontend/.env.local
# Edit both files with your API keys and wallet info

# 4. Start all services
docker-compose up

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - PostgreSQL: localhost:5432
```

---

## 📚 Detailed Setup

### Step 1: Environment Configuration

**Backend (.env):**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mnee_payroll"

# Ethereum Configuration
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
ETHEREUM_CHAIN_ID=11155111  # Sepolia testnet

# MNEE Token (ERC-20)
MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"

# Platform Wallet (custodial)
PLATFORM_WALLET_ADDRESS="0xYourGeneratedPlatformAddress"
PLATFORM_PRIVATE_KEY="0xYourGeneratedPrivateKey"

# For mock mode (development without real transactions)
# Simply leave PLATFORM_PRIVATE_KEY empty
```

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_ETHEREUM_CHAIN_ID=11155111
NEXT_PUBLIC_MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id_here"
```

**Get API Keys:**
1. **Infura**: Sign up at [infura.io](https://infura.io/), create project, copy API key
2. **WalletConnect**: Sign up at [cloud.walletconnect.com](https://cloud.walletconnect.com/), create project, copy Project ID

**Get Test Funds:**
1. **Sepolia ETH**: Visit [sepoliafaucet.com](https://sepoliafaucet.com/), request 0.5 ETH for gas
2. **MNEE Tokens**: Contact hackathon organizers for test MNEE on Sepolia

### Step 2: Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Seed test data (creates employer + 3 employees)
npm run seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### Step 3: Deploy Agent (Optional)

```bash
cd agents

# Install dependencies
npm install

# For local testing
npm run dev

# For deployment to MNEE Agent Runtime (conceptual)
npm run deploy
```

### Step 4: Start Application

```bash
# From root directory

# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Step 5: Connect Wallet

1. Open http://localhost:3000
2. Click **"Connect Wallet"** (RainbowKit button)
3. Connect your MetaMask with Sepolia testnet
4. System will auto-create employer profile if new wallet
5. Explore dashboard, employees, payroll pages

---

## 🎬 Demo Script

We've included a 2-minute demo script that showcases the full workflow:

```bash
# Make script executable
chmod +x demo.sh

# Run demo (requires backend running)
./demo.sh
```

**What the demo does:**

1. ✅ Checks backend health
2. ✅ Fetches employer data
3. ✅ Lists current employees
4. ✅ Adds a new employee
5. ✅ Runs payroll (test mode)
6. ✅ Shows transaction results with tx hashes
7. ✅ Displays any alerts

**Perfect for hackathon judges!** 🏆

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd frontend

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_ETHEREUM_CHAIN_ID
# - NEXT_PUBLIC_MNEE_TOKEN_ADDRESS
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
```

### Backend (Railway / Render)

```bash
cd backend

# Build
npm run build

# Deploy via Railway CLI
railway up

# Or push to GitHub and connect Railway/Render
# Set environment variables in dashboard
```

### Agent (MNEE Agent Runtime)

```bash
cd agents
npm run deploy

# Monitor at: https://agent-dashboard.mnee.io (conceptual)
```

---

## 🧪 Testing

### Run Unit Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

### Integration Testing

```bash
# Start services
docker-compose up -d

# Run demo script
./demo.sh
```

### Manual Testing Checklist

- [ ] Connect MetaMask successfully (Sepolia network)
- [ ] View dashboard with summary cards and virtual balance
- [ ] Add a new employee with Ethereum address
- [ ] Edit employee details
- [ ] Deactivate an employee
- [ ] Run payroll (test mode)
- [ ] View transaction in payroll history
- [ ] Check Etherscan link for transaction
- [ ] Check alerts panel for warnings
- [ ] Update settings (payroll day, budget)
- [ ] Test deposit/withdrawal flows
- [ ] Disconnect wallet

---

## 📁 Project Structure

```
mnee-autonomous-payroll/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/
│   │   │   ├── ethereumService.ts  # MNEE ERC-20 integration
│   │   │   └── balanceService.ts   # Virtual balance management
│   │   ├── middleware/      # Auth, logging, errors
│   │   ├── server.ts        # Main entry point
│   │   └── seed.ts          # Database seeding
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── tests/               # API tests
│   └── package.json
├── frontend/                # Next.js 14 App
│   ├── app/
│   │   ├── dashboard/       # Dashboard page
│   │   ├── employees/       # Employee management
│   │   ├── payroll/         # Payroll execution
│   │   ├── settings/        # Settings page
│   │   ├── providers.tsx    # RainbowKit + Wagmi setup
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── Navigation.tsx   # Main navigation
│   │   └── BalanceDashboard.tsx  # Virtual balance UI
│   ├── lib/
│   │   ├── api.ts           # Backend API client
│   │   ├── store.ts         # Zustand state
│   │   └── utils.ts         # Helper functions
│   └── package.json
├── contracts/               # Smart Contract (Conceptual)
│   ├── salary_flow.mnee.ts  # Flow contract (TypeScript DSL)
│   ├── deploy.ts            # Deployment script
│   └── tests/               # Contract tests
├── agents/                  # Autonomous Agent
│   ├── salary_agent.ts      # Payroll automation agent
│   ├── deploy_agent.ts      # Agent deployment
│   └── package.json
├── scripts/
│   ├── generate-eth-wallets.ts  # Generate test Ethereum wallets
│   └── create-test-wallets.ts   # Legacy (Bitcoin, deprecated)
├── docs/                    # Specification docs
│   ├── ETHEREUM_MIGRATION.md     # Migration guide
│   ├── MIGRATION_STATUS.md       # Progress tracker
│   ├── mvp_features_list.md
│   ├── architecture.md
│   └── project_setup.md
├── docker-compose.yml       # Docker orchestration
├── demo.sh                  # Hackathon demo script
├── .env.example             # Environment template
├── .gitignore
├── package.json             # Monorepo root
└── README.md                # This file
```

---

## 🏆 Hackathon Pitch

### **2-Minute Pitch for Judges**

> **"We built a fully autonomous payroll system that runs on Ethereum using the MNEE ERC-20 stablecoin."**

**The Problem:**
- Companies manually process payroll every month
- Errors are common (wrong amounts, missed payments, duplicate transactions)
- No transparency—employees can't verify payments

**Our Solution:**
- **Autonomous Agent** runs daily, executes payroll automatically
- **AI Guard** prevents errors before they happen
- **Ethereum-based**—transparent, auditable, secure
- **Full transparency**—every transaction on-chain with Etherscan verification

**What Makes It Special:**
1. **Truly Autonomous**: Set payday once, agent handles everything
2. **Built-in Safety**: AI checks balances, validates addresses, detects anomalies
3. **Multi-Employer Platform**: Virtual balance system supports multiple companies
4. **Production-Ready**: Full backend, frontend, tests, deployment scripts

**Tech Highlights:**
- **Ethereum blockchain** with Sepolia testnet support
- **MNEE ERC-20 stablecoin** for salary payments
- **ethers.js v6** for blockchain interactions
- **RainbowKit + wagmi** for wallet connections
- **Full-Stack MVP**: Next.js + Node.js + PostgreSQL

**Demo:**
*[Run `./demo.sh` to show live payroll execution]*

**Impact:**
- Saves companies hours per month
- Eliminates human error
- Provides transparent, auditable payments
- Showcases MNEE's stablecoin integration on Ethereum

**Next Steps:**
- Add streaming payments (real-time salary accrual)
- Multi-org role management (HR vs Finance)
- Tax withholding automation
- Mobile app for employees

**We're ready for testnet demonstration today.** 🚀

---

## 🔮 Future Roadmap

### Phase 2 Features

- [ ] **Streaming Payments**: Real-time salary accrual (e.g., pay-per-second)
- [ ] **Multi-Currency Support**: Pay in USDC, USDT, DAI via DEX integration
- [ ] **Org Role Management**: Separate permissions for HR and Finance teams
- [ ] **Tax Module**: Automatic tax withholding and reporting
- [ ] **Realtime Notifications**: Email/SMS alerts for payments
- [ ] **Mobile App**: React Native app for employees
- [ ] **Analytics Dashboard**: Payroll forecasting and insights
- [ ] **Contractor Support**: 1099 payments and invoicing

### Phase 3 (Scaling)

- [ ] **Multi-Chain**: Expand beyond Ethereum (Polygon, Arbitrum, Base)
- [ ] **Fiat Off-Ramp**: Direct bank transfers via Stripe/Circle
- [ ] **Compliance Tools**: SOC 2, GDPR compliance features
- [ ] **API for Third-Party Apps**: Zapier integration, webhooks
- [ ] **White-Label Solution**: Rebrand for enterprises

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mnee-autonomous-payroll/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mnee-autonomous-payroll/discussions)
- **MNEE Hackathon**: [mnee-eth.devpost.com](https://mnee-eth.devpost.com/)
- **Etherscan**: [Token Contract](https://etherscan.io/token/0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF)

---

## 🙏 Acknowledgments

- **MNEE Team** for providing the ERC-20 stablecoin for Ethereum integration
- **Hackathon Organizers** for the opportunity
- **Open Source Community** for amazing tools (Next.js, Prisma, shadcn/ui, RainbowKit)

---

## ⭐ Star Us!

If you find this project useful, please consider giving it a star on GitHub! ⭐

It helps others discover the project and motivates us to keep improving it.

---

**Built with ❤️ for the MNEE Hackathon**

*Ethereum-Native | Production-Ready | Open Source*
