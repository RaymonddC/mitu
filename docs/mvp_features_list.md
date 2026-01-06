# MVP Feature List — MNEE Payroll Autonomous Agent

This document describes the full MVP scope for the **Autonomous Payroll Agent** built entirely on **MNEE Network**, using:
- **MNEE Native Stable Asset** for all payments
- **MNEE Agent Runtime** for automation
- **MNEE Flow Contracts** for on-chain salary logic
- **Backend (Node.js)** for company/admin management
- **Frontend (Next.js)** for employer UX

---

# 🎯 1. Core MVP Goals
The MVP must deliver:
- A simple way for employers to register employees
- Automatic salary execution (every month or custom)
- Secure on-chain payroll using MNEE flows
- AI-driven checks to prevent errors
- Transparent logs for auditing

---

# 🟩 2. MVP Features (Detailed)

## 2.1 **Employer Onboarding**
- Create employer account (email + wallet)
- Connect wallet via MNEE WalletConnect
- Setup organization profile:
  - Company name
  - Payroll wallet (employer treasury)
  - Preferred payment day


## 2.2 **Employee Management**
### Features:
- Add new employee
- Store:
  - Name
  - Email (optional)
  - Wallet address
  - Salary amount (MNEE asset)
  - Payment cycle (monthly/weekly/custom date)
- Edit employee data
- Disable/activate employee

### Backend:
- PostgreSQL table: `employees`
- Relations to employer ID


## 2.3 **Payroll Configuration**
- Employer chooses salary date (e.g., 28 every month)
- Option to override per employee
- Backend stores schedule


## 2.4 **MNEE Flow Contract: Salary Payment**
This is the **core on-chain logic**.
- Contract stores:
  - Employer wallet
  - Employee wallet
  - Amount
  - Cycle interval
- Provides methods:
  - `executeSalary()` → Transfers funds
  - `validateFunds()` → Ensures employer wallet has enough
  - `emitPayrollEvent()` → Creates audit logs

This contract is written in **TypeScript MNEE Flow DSL**.


## 2.5 **Autonomous Payroll Agent**
Runs on **MNEE Agent Runtime**.

### Responsibilities:
- Check if today is a salary day
- Validate employer wallet balance
- Execute salary contract
- Retry if payment fails
- Notify employer if:
  - Insufficient balance
  - Invalid employee wallet
  - Contract error

### Features:
- Runs automatically without cron
- Uses MNEE’s autonomous execution triggers
- Gasless execution for employer


## 2.6 **On-chain Salary Execution (MNEE Native Asset)**
- Transfer MNEE stable asset from employer → employee
- Guaranteed settlement
- Transaction details stored in audit log


## 2.7 **Audit Trail (On-chain + Database)**
### On-chain events:
- Payment executed
- Payment failed
- Agent triggered

### Backend logs:
- Employee ID
- Tx hash
- Timestamp

### Frontend view:
- Employer can see full salary history


## 2.8 **AI Agent Guard (Risk & Error Prevention)**
AI agent runs checks BEFORE executing salary:
- Missing employee wallet
- Duplicate employees
- Suspicious salary changes
- Employer wallet is too low
- Salary set above configured company lock limit (optional)

Agent explains:
- "Payment skipped: insufficient funds"
- "Employee wallet invalid format"
- "Risk alert: salary updated from 2,000 to 20,000 MNEE"


## 2.9 **Frontend App (Next.js)**
Minimal but clean employer interface.

### Pages:
1. **Dashboard**
   - Employer balance
   - Upcoming payroll
   - Warning alerts

2. **Employees Page**
   - Employee list
   - Add/Edit employee modal

3. **Payroll History**
   - Salary execution logs

4. **Settings**
   - Payroll wallet
   - Payroll schedule


---

# 🟦 3. Technical MVP Scope

## 3.1 Backend
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- MNEE SDK v1.0

## 3.2 Frontend
- Next.js
- TailwindCSS
- Shadcn UI
- MNEE WalletConnect

## 3.3 On-chain (MNEE)
- 1 Flow Contract: `salary_flow.mnee.ts`
- 1 AI Agent: `salary_agent.ts`

## 3.4 Testnet Setup
- Employer test wallet
- Employee test wallet
- MNEE faucet
- Testnet RPC

---

# 🟣 4. What Is NOT Included (Out-of-Scope for MVP)
To keep the project small and judge-friendly, we exclude:
- Streaming payments (future version)
- Multi-currency support
- Org role management (HR vs Finance)
- Mobile app
- Tax module
- Realtime notifications

These can become **Phase 2 features**.

---

# 🚀 5. MVP Completion Criteria
The MVP is "done" when:
- Employer can add employees
- Salary flow contract deployed on MNEE
- Agent auto-executes monthly salary
- Employees receive MNEE payments
- Employer sees logs
- AI agent prevents basic errors

---

# 🎉 Ready for Hackathon Submission
This scope is:
- Lean
- Practical
- MNEE-native
- Shows autonomous agents in action
- Provides real-world value

Say **"Next"** and I’ll generate the next `.md` file.

