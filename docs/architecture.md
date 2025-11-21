# System Architecture — MNEE Autonomous Payroll Agent

This document explains the full technical architecture of the **Autonomous Payroll Agent** built entirely on the **MNEE Network**.

No ICP, no external chains — fully powered by:
- **MNEE Agent Runtime**
- **MNEE Flow Contracts (TypeScript DSL)**
- **MNEE Native Stable Asset**
- **MNEE WalletConnect**
- **Backend + Frontend** around it

---

# 🏛️ 1. High-Level Architecture Overview
```
┌──────────────────────────────┐
│          Frontend            │
│      (Next.js + shadcn)      │
│ - Employer Dashboard          │
│ - Employee Management         │
│ - Payroll History             │
└───────────────┬──────────────┘
                │ REST / RPC
┌───────────────▼──────────────┐
│            Backend            │
│   (Node.js + Express + DB)   │
│ - Employer accounts           │
│ - Employee DB                 │
│ - Payroll schedule            │
│ - MNEE SDK bridge             │
└───────────────┬──────────────┘
                │ Trigger Calls
┌───────────────▼──────────────┐
│     MNEE Agent Runtime        │
│  Autonomous Salary Executor   │
│ - Executes salary flows       │
│ - Performs balance checks     │
│ - Emits audit events          │
└───────────────┬──────────────┘
                │ On-chain Ops
┌───────────────▼──────────────┐
│     MNEE Flow Contract        │
│   salary_flow.mnee.ts         │
│ - Employer→Employee transfer  │
│ - Auth + validation           │
│ - Execution logs              │
└───────────────┬──────────────┘
                │ Settlement
┌───────────────▼──────────────┐
│     MNEE Native Asset Layer   │
│ - Stable MNEE for salaries    │
│ - Instant finality            │
└──────────────────────────────┘
```
---

# 🟦 2. Frontend Architecture (Next.js)
## Tech Stack
- Next.js 14 App Router
- TailwindCSS
- Shadcn UI
- Zustand (for wallet state)
- MNEE WalletConnect

## Responsibilities
- Connect employer wallet
- CRUD employees
- Configure payroll date
- Display salary history
- Show alerts from AI Agent

## Frontend → Backend Calls
- `POST /employees`
- `GET /employees`
- `POST /payroll/schedule`
- `GET /payroll/history`
- `GET /alerts`

---

# 🟩 3. Backend Architecture (Node.js)
## Tech Stack
- Express
- Prisma ORM
- PostgreSQL
- MNEE SDK
- JWT / Session Auth

## Backend Responsibilities
- Store employer + employee profiles
- Store salary schedules
- Relay actions to MNEE Flow Contracts
- Provide API for frontend
- Store off-chain audit logs

## Database Schema (Simplified)
```
Employer
- id
- wallet
- company_name
- payroll_day

Employee
- id
- employer_id
- name
- salary_amount
- wallet
- active

PayrollLog
- id
- employer_id
- employee_id
- amount
- tx_hash
- timestamp
- status
```

---

# 🟨 4. MNEE Flow Contract Architecture
### File: `salary_flow.mnee.ts`
Contracts are written in **TypeScript DSL**, not Solidity.

## Responsibilities
- Validate employer authorization
- Validate employer funds
- Execute salary transfer
- Emit events
- Expose functions to the MNEE AI Agent

## Core Methods
```
function executeSalary(employer, employee, amount)
function checkFunds(employer)
function logEvent(type, details)
```

## Events
- `SalaryExecuted`
- `SalaryFailed`
- `InvalidWallet`
- `InsufficientBalance`

---

# 🟥 5. Autonomous Salary Agent Architecture
### File: `salary_agent.ts`
Runs entirely on **MNEE Agent Runtime**.

## Triggers
Uses MNEE’s agent triggering:
- Daily at 00:00 UTC
- Or custom employer-defined schedule

## Responsibilities
1. Fetch payroll schedule from backend
2. Determine if today is execution day
3. Validate employer balance using Flow Contract
4. Execute salary transfers
5. Emit audit events
6. Send notifications to backend

## Internal Logic Flow
```
for employer in employers:
  if today == employer.payroll_day:
    for employee in employer.employees:
      if valid(employee):
         executeSalaryFlow()
      else:
         log error
```

---

# 🟫 6. AI Guard Layer
Part of the MNEE Agent.

## Tasks
- Detect suspicious salary changes
- Detect inactive wallet addresses
- Predict fund shortage risk
- Provide employer warnings

AI Guard runs BEFORE salary execution.

---

# 🟪 7. MNEE Native Asset Layer
Used for:
- All salary payments
- Contract fees (if any)
- Audit event settlement

Benefits:
- Instant finality
- Zero slippage
- Stable value

---

# 🟧 8. Testnet Architecture
You will use:
- MNEE Testnet RPC
- Faucet for employer wallet
- Test employee wallets
- Test agent environment

Backend + contract config:
```
MNEE_RPC_URL=testnet.node.mnee.io
MNEE_CHAIN_ID=testnet
EMPLOYER_PRIVATE_KEY=...
```

---

# 🟩 9. Deployment Architecture
## Frontend
- Vercel / Netlify

## Backend
- Render / Railway

## Agents & Contracts
- Deployed directly to **MNEE Network**

---

# 🎉 10. Architecture Summary
This architecture is:
- Fully MNEE-native
- Judge-friendly
- Lightweight
- Production-ready
- Easy to extend with future features (streams, multi-org, tax, AI payroll forecasting)

Say **“Next”** for the next `.md` file.

