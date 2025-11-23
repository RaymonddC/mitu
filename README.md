# MNEE Autonomous Payroll Agent

> **Hackathon Project**: Fully autonomous, MNEE-native payroll system powered by MNEE Flow Contracts and MNEE Agent Runtime

[![MNEE Network](https://img.shields.io/badge/MNEE-Native-1B5BF9)](https://mnee.io)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Testnet](https://img.shields.io/badge/network-testnet-yellow)](https://testnet.mnee.io)

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

The **MNEE Autonomous Payroll Agent** is a production-ready MVP that automates employee salary payments using **100% MNEE-native technology**. No ICP, no external stablecoins—just pure MNEE.

### What it does:

1. **Employers** register and add employees with wallet addresses and salary amounts
2. **Autonomous Agent** runs daily, checking if it's payday for any employer
3. **Flow Contract** executes transfers with built-in safety checks (balance validation, budget caps)
4. **AI Guard** prevents errors (insufficient funds, invalid wallets, suspicious changes)
5. **Full Audit Trail** stores events on-chain + database for transparency

### Why it matters:

- **Eliminates manual payroll** → Set it and forget it
- **100% transparent** → Every transaction on-chain
- **Secure by design** → AI-powered checks before every payment
- **MNEE-native** → Leverages MNEE's unique autonomous execution capabilities

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend (Next.js)"]
        UI[Dashboard + Employees + Payroll Pages]
        Wallet[MNEE Wallet Connect]
    end

    subgraph Backend["⚙️ Backend (Node.js + Express)"]
        API[REST API]
        DB[(PostgreSQL)]
        SDK[MNEE SDK]
    end

    subgraph MNEE["🔷 MNEE Network"]
        Agent[🤖 Autonomous Agent<br/>salary_agent.ts]
        Contract[📜 Flow Contract<br/>salary_flow.mnee.ts]
        Blockchain[⛓️ MNEE Blockchain<br/>Native Asset Layer]
    end

    UI -->|API Calls| API
    Wallet -->|Connect| UI
    API -->|Store/Query| DB
    API -->|Trigger Payroll| SDK
    SDK -->|Call Contract| Contract

    Agent -->|Daily Check| API
    Agent -->|Read Schedule| DB
    Agent -->|Execute Salary| Contract

    Contract -->|Validate & Transfer| Blockchain
    Contract -->|Emit Events| Agent
    Contract -->|Log TX| DB

    Blockchain -->|Balance Check| Contract
    Blockchain -->|Confirmed TX| API

    style Frontend fill:#1B5BF9,stroke:#fff,color:#fff
    style Backend fill:#111827,stroke:#fff,color:#fff
    style MNEE fill:#22C55E,stroke:#fff,color:#fff
```

### Component Flow:

1. **Employer** connects wallet → adds employees via frontend
2. **Backend** stores employee data + schedules in PostgreSQL
3. **Autonomous Agent** (runs on MNEE Agent Runtime):
   - Checks daily if it's payday for any employer
   - Validates balances via Flow Contract
   - Executes salary transfers for each employee
   - Retries failures, creates alerts
4. **Flow Contract** (MNEE TypeScript DSL):
   - Validates employer/employee relationships
   - Checks monthly budget caps
   - Transfers MNEE from employer → employee
   - Emits events for audit trail
5. **Frontend** displays:
   - Real-time payroll status
   - Transaction history with tx hashes
   - AI agent alerts and recommendations

---

## ✨ Features

### Core MVP Features

- ✅ **Employer Onboarding**: Connect MNEE wallet, set up company profile
- ✅ **Employee Management**: Add/edit/deactivate employees with wallet addresses
- ✅ **Payroll Scheduling**: Configure payday (1-28 of month)
- ✅ **Autonomous Execution**: Agent runs daily, executes due payroll automatically
- ✅ **Manual Override**: "Run Payroll Now" button for immediate execution
- ✅ **AI Guard Checks**:
  - Insufficient balance detection
  - Invalid wallet validation
  - Suspicious salary change alerts (>50% change)
  - Monthly budget cap enforcement
- ✅ **Audit Trail**: Full transaction history with tx hashes
- ✅ **Test Mode**: Simulate transactions without blockchain execution

### Security Features

- 🔒 Private key stored in `.env` (never committed)
- 🔒 Idempotency keys prevent duplicate payments
- 🔒 Retry logic with max attempts (3)
- 🔒 Signed audit logs with tx metadata
- 🔒 Rate limiting on API endpoints
- 🔒 Input validation with Zod schemas

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + shadcn/ui components
- **State**: Zustand
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Language**: TypeScript

### Blockchain
- **Network**: MNEE Testnet (sandbox environment)
- **SDK**: @mnee/ts-sdk (official MNEE TypeScript SDK)
- **Contracts**: MNEE Flow Contracts (TypeScript DSL) - optional
- **Agent**: MNEE Agent Runtime - optional
- **Asset**: MNEE USD (stablecoin on Bitcoin)

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
- **MNEE Testnet Wallet** with test funds ([Get from faucet](https://faucet.testnet.mnee.io))

---

## 🚀 Quick Start

### Option 1: Local Development (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/mnee-autonomous-payroll.git
cd mnee-autonomous-payroll

# 2. Install dependencies (monorepo)
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env and add your MNEE testnet wallet keys
nano .env

# 5. Start PostgreSQL (via Docker)
docker run --name mnee-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine

# 6. Run database migrations + seed data
npm run db:migrate
npm run db:seed

# 7. Start backend + frontend concurrently
npm run dev

# 8. Open browser
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
```

### Option 2: Docker Compose

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/mnee-autonomous-payroll.git
cd mnee-autonomous-payroll
cp .env.example .env

# 2. Edit .env with your keys
nano .env

# 3. Start all services
docker-compose up

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - PostgreSQL: localhost:5432
```

---

## 📚 Detailed Setup

### Step 1: Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

**Required variables:**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mnee_payroll"

# MNEE SDK Configuration
MNEE_API_KEY="your-mnee-api-key-here"           # Get from https://developer.mnee.net/
MNEE_ENVIRONMENT="sandbox"                       # Use "sandbox" for testnet, "production" for mainnet

# Wallets (WIF format - get from MNEE testnet)
EMPLOYER_PRIVATE_KEY="your_employer_wif_key"    # Wallet Import Format private key
AGENT_PRIVATE_KEY="your_agent_wif_key"          # WIF private key for agent

# Legacy Configuration (optional)
MNEE_RPC_URL="https://testnet.mnee-rpc.io"
MNEE_CHAIN_ID="mnee-testnet-1"
SALARY_CONTRACT_ADDRESS=""                       # Optional: set after contract deployment
```

**Get MNEE SDK Access:**
1. Create account at [MNEE Developer Portal](https://developer.mnee.net/)
2. Generate API key for sandbox (testnet) environment
3. Add API key to `.env` as `MNEE_API_KEY`

**Get testnet funds:**
1. Visit [MNEE Testnet Faucet](https://faucet.testnet.mnee.io) or use sandbox faucet
2. Request test MNEE for your employer wallet (10 MNEE every 24 hours in sandbox)
3. Export your wallet's WIF private key
4. Save WIF key to `.env` as `EMPLOYER_PRIVATE_KEY`

**Important Notes:**
- The system uses the official `@mnee/ts-sdk` package for blockchain interactions
- Wallet addresses must be Bitcoin format (start with '1', '3', or 'bc1')
- Private keys must be in WIF (Wallet Import Format)
- Mock mode activates automatically if `MNEE_API_KEY` is not configured

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

### Step 3: Deploy Contracts

```bash
cd contracts

# Install dependencies
npm install

# Deploy salary flow contract to MNEE testnet
npm run deploy

# Copy the contract address from output
# Add it to .env: SALARY_CONTRACT_ADDRESS="mnee_contract_..."
```

### Step 4: Deploy Autonomous Agent

```bash
cd agents

# Install dependencies
npm install

# Deploy agent to MNEE Agent Runtime
npm run deploy

# Agent will run daily at 00:00 UTC
# For local testing: npm run dev
```

### Step 5: Start Application

```bash
# From root directory

# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Step 6: Connect Wallet

1. Open http://localhost:3000
2. Click **"Connect Wallet"**
3. Use test wallet address: `mnee1test_employer_wallet_address_12345`
4. Explore dashboard, employees, payroll pages

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
6. ✅ Shows transaction results
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

# Set environment variables in Vercel dashboard
```

### Backend (Railway / Render)

```bash
cd backend

# Build
npm run build

# Deploy via Railway CLI
railway up

# Or push to GitHub and connect Railway/Render
```

### Contracts & Agent (MNEE Network)

```bash
# Deploy contract
cd contracts
npm run deploy

# Deploy agent
cd agents
npm run deploy

# Both deploy to MNEE Testnet
# Monitor at: https://agent-dashboard.mnee.io
```

---

## 🧪 Testing

### Run Unit Tests

```bash
# Backend tests
cd backend
npm run test

# Contract tests
cd contracts
npm run test

# Frontend tests
cd frontend
npm run test
```

### Integration Testing

```bash
# Start services
docker-compose up -d

# Run integration tests
npm run test:integration

# Run demo script
./demo.sh
```

### Manual Testing Checklist

- [ ] Connect wallet successfully
- [ ] View dashboard with summary cards
- [ ] Add a new employee
- [ ] Edit employee details
- [ ] Deactivate an employee
- [ ] Run payroll (test mode)
- [ ] View transaction in payroll history
- [ ] Check alerts panel for warnings
- [ ] Update settings (payroll day, budget)
- [ ] Disconnect wallet

---

## 📁 Project Structure

```
mnee-autonomous-payroll/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # MNEE SDK integration
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
│   │   └── settings/        # Settings page
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   └── Navigation.tsx   # Main navigation
│   ├── lib/
│   │   ├── api.ts           # Backend API client
│   │   ├── store.ts         # Zustand state
│   │   └── utils.ts         # Helper functions
│   └── package.json
├── contracts/               # MNEE Flow Contracts
│   ├── salary_flow.mnee.ts  # Main payroll contract
│   ├── deploy.ts            # Contract deployment
│   ├── tests/               # Contract tests
│   └── package.json
├── agents/                  # MNEE Autonomous Agents
│   ├── salary_agent.ts      # Payroll automation agent
│   ├── deploy_agent.ts      # Agent deployment
│   └── package.json
├── docs/                    # Specification docs
│   ├── mvp_features_list.md
│   ├── architecture.md
│   ├── project_setup.md
│   └── ui_ux_spec.md
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

> **"We built a fully autonomous payroll system that runs 100% on MNEE Network."**

**The Problem:**
- Companies manually process payroll every month
- Errors are common (wrong amounts, missed payments, duplicate transactions)
- No transparency—employees can't verify payments

**Our Solution:**
- **Autonomous Agent** runs daily, executes payroll automatically
- **AI Guard** prevents errors before they happen
- **100% MNEE-native**—no external dependencies
- **Full transparency**—every transaction on-chain with audit trail

**What Makes It Special:**
1. **Truly Autonomous**: Set payday once, agent handles everything
2. **Built-in Safety**: AI checks balances, validates wallets, detects anomalies
3. **MNEE-Native**: Uses MNEE Flow Contracts + Agent Runtime
4. **Production-Ready**: Full backend, frontend, tests, deployment scripts

**Tech Highlights:**
- **MNEE Flow Contract** (TypeScript DSL) for on-chain logic
- **MNEE Agent Runtime** for autonomous execution
- **MNEE Native Asset** for stable salary payments
- **Full-Stack MVP**: Next.js + Node.js + PostgreSQL

**Demo:**
*[Run `./demo.sh` to show live payroll execution]*

**Impact:**
- Saves companies hours per month
- Eliminates human error
- Provides transparent, auditable payments
- Showcases MNEE's unique autonomous capabilities

**Next Steps:**
- Add streaming payments (real-time salary accrual)
- Multi-org role management (HR vs Finance)
- Tax withholding automation
- Mobile app for employees

**We're ready for mainnet deployment today.** 🚀

---

## 🔮 Future Roadmap

### Phase 2 Features

- [ ] **Streaming Payments**: Real-time salary accrual (e.g., pay-per-second)
- [ ] **Multi-Currency Support**: Pay in USDC, USDT, ETH via MNEE
- [ ] **Org Role Management**: Separate permissions for HR and Finance teams
- [ ] **Tax Module**: Automatic tax withholding and reporting
- [ ] **Realtime Notifications**: Email/SMS alerts for payments
- [ ] **Mobile App**: React Native app for employees
- [ ] **Analytics Dashboard**: Payroll forecasting and insights
- [ ] **Contractor Support**: 1099 payments and invoicing

### Phase 3 (Scaling)

- [ ] **Multi-Chain**: Expand beyond MNEE (Ethereum, Polygon)
- [ ] **Fiat Off-Ramp**: Direct bank transfers
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
- **MNEE Network**: [mnee.io](https://mnee.io)

---

## 🙏 Acknowledgments

- **MNEE Network** for providing the autonomous execution infrastructure
- **Hackathon Organizers** for the opportunity
- **Open Source Community** for amazing tools (Next.js, Prisma, shadcn/ui)

---

## ⭐ Star Us!

If you find this project useful, please consider giving it a star on GitHub! ⭐

It helps others discover the project and motivates us to keep improving it.

---

**Built with ❤️ for the MNEE Hackathon**

*100% MNEE-Native | Production-Ready | Open Source*
