# Project Setup — MNEE Autonomous Payroll Agent

This guide explains how to set up the full development environment for building, testing, and deploying the **MNEE-native Autonomous Payroll Agent**.

No ICP. No Solidity. 100% MNEE.

---

# 🟩 1. Prerequisites

### Required Tools
- Node.js 18+
- pnpm or npm
- Docker (for PostgreSQL)
- Git
- VSCode
- MNEE CLI (if available)

### Accounts Needed
- MNEE Testnet Wallet (Employer)
- MNEE Testnet Wallet (Employee)
- MNEE Testnet Faucet access

---

# 🟦 2. Project Structure
```
root/
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/
│   ├── app/
│   └── package.json
├── contracts/
│   └── salary_flow.mnee.ts
└── agents/
    └── salary_agent.ts
```
---

# 🟧 3. Environment Variables
Create a `.env` file inside `backend/`:
```
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mnee_payroll

# MNEE Testnet
MNEE_RPC_URL=https://testnet.mnee-rpc.io
MNEE_CHAIN_ID=mnee-testnet-1

# Wallets
EMPLOYER_PRIVATE_KEY=your_employer_testnet_key_here
AGENT_PRIVATE_KEY=your_agent_key_here
```

Inside `frontend/`:
```
NEXT_PUBLIC_MNEE_RPC_URL=https://testnet.mnee-rpc.io
NEXT_PUBLIC_MNEE_CHAIN_ID=mnee-testnet-1
```

---

# 🟨 4. Database Setup
Use Docker for PostgreSQL:
```
docker run --name mnee_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

Install Prisma in backend:
```
cd backend
pnpm install
pnpm prisma migrate dev
```

---

# 🟥 5. Backend Setup (Node.js + Express)

### Install dependencies
```
cd backend
pnpm install express prisma @prisma/client mnee-sdk cors dotenv
```

### Run backend
```
pnpm dev
```

Backend endpoints:
- `GET /employees`
- `POST /employees`
- `POST /payroll/schedule`
- `GET /payroll/history`

---

# 🟦 6. Frontend Setup (Next.js)

### Install dependencies
```
cd frontend
pnpm install next tailwindcss shadcn-ui zustand mnee-walletconnect
```

### Run dev server
```
pnpm dev
```

### Pages included in starter
- Dashboard
- Employees
- Payroll Schedule
- Salary History

---

# 🟪 7. Contract Setup — MNEE Flow Contract
File: `contracts/salary_flow.mnee.ts`

### Install MNEE Flow SDK
```
pnpm install mnee-flow-dsl
```

### Compile contract
```
npx mnee-flow compile contracts/salary_flow.mnee.ts
```

### Deploy contract
```
npx mnee-flow deploy contracts/salary_flow.mnee.ts --network testnet
```

Deployment output example:
```
Contract deployed at: mnee1xyz...
```

Store contract address in backend `.env`:
```
SALARY_CONTRACT_ADDRESS=mnee1xyz...
```

---

# 🟫 8. Agent Setup — MNEE Agent Runtime
File: `agents/salary_agent.ts`

### Install agent dependencies
```
pnpm install mnee-agent-runtime mnee-flow-dsl
```

### Local test
```
npx mnee-agent run agents/salary_agent.ts
```

### Deploy agent
```
npx mnee-agent deploy agents/salary_agent.ts --network testnet
```

---

# 🟩 9. Testnet Workflow

### Step 1 — Get Test MNEE tokens
Use faucet → send to employer wallet.

### Step 2 — Add Employee wallets
Use frontend → Add wallets from test accounts.

### Step 3 — Trigger agent manually (test mode)
```
npx mnee-agent trigger salary_agent
```

### Step 4 — Check on-chain logs
View events:
```
npx mnee-flow events --contract SALARY_CONTRACT_ADDRESS
```

---

# 🟧 10. Deployment Plan

## Frontend
Deploy to Vercel:
```
vercel --prod
```

## Backend
Deploy to Railway/Render:
```
git push
```

## Contract + Agent
Deploy using MNEE CLI:
```
npx mnee-flow deploy
npx mnee-agent deploy
```

---

# 🎉 11. Setup Complete
Your full MNEE-native payroll system is now ready to run on testnet and prepare for hackathon submission.

Say **“Next”** for the next `.md` file.

