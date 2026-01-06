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

---

# 📝 11. Architecture Update - December 2025

**Note**: The system has evolved from the original MNEE-native architecture to an Ethereum-based implementation with enhanced security features.

## Current Architecture (v2.0)

### Technology Stack Migration

**From** (Original):
- MNEE Network
- MNEE Flow Contracts
- MNEE Agent Runtime
- MNEE WalletConnect

**To** (Current):
- Ethereum Network (Sepolia testnet / Mainnet)
- ERC-20 MNEE Token
- Solidity Smart Contracts (Batch Transfer)
- MetaMask + RainbowKit + wagmi/viem

### High-Level Flow (Updated)

```
┌─────────────────────────────────────────────────┐
│              User (Employer)                    │
│         MetaMask Wallet + MNEE Tokens           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js 14)                 │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │  Dashboard   │  │   Payroll    │           │
│  │    Page      │  │    Page      │           │
│  └──────────────┘  └──────────────┘           │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │     WalletApproval Component              │ │
│  │                                           │ │
│  │  1. Validates BEFORE MetaMask ←──────────┼─┼─ NEW!
│  │  2. Shows duplicate warnings              │ │
│  │  3. Batch or individual mode              │ │
│  │  4. Signs with MetaMask                   │ │
│  └───────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────┘
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────┐
│            Backend (Express)                    │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │   Validation Layer (NEW!)             │     │
│  │                                        │     │
│  │  Layer 1: Pre-Approval Check          │     │
│  │   → Check idempotency before approval │     │
│  │                                        │     │
│  │  Layer 2: Pre-Transaction Validation  │     │
│  │   → /api/wallet/approvals/:id/validate│     │
│  │   → Returns: allAlreadyPaid,          │     │
│  │              someAlreadyPaid           │     │
│  │                                        │     │
│  │  Layer 3: Always Record                │     │
│  │   → Never skip PayrollLog creation     │     │
│  │   → Flag duplicates in metadata        │     │
│  └──────────────────────────────────────┘     │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │   Business Logic                      │     │
│  │   - Wallet Signing Service            │     │
│  │   - Payroll Controller                │     │
│  │   - Employee Management               │     │
│  └──────────────────────────────────────┘     │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │   Data Layer (Prisma + PostgreSQL)   │     │
│  │   - PayrollLog (with idempotency key) │     │
│  │   - PayrollApproval                   │     │
│  │   - Employee, Employer                │     │
│  └──────────────────────────────────────┘     │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│     Ethereum Network (Sepolia/Mainnet)          │
│                                                 │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │  MNEE Token     │  │  Batch Transfer    │  │
│  │  (ERC-20)       │  │  Contract V2       │  │
│  │                 │  │                    │  │
│  │  transfer()     │  │  batchTransfer(    │  │
│  │  approve()      │  │    token,          │  │
│  │  allowance()    │  │    totalAmount,    │  │
│  │                 │  │    recipients[],   │  │
│  │                 │  │    amounts[]       │  │
│  │                 │  │  )                 │  │
│  └─────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### New Validation Flow

**Critical Addition**: Pre-transaction validation prevents duplicate payments on blockchain.

```
User clicks "Approve with Wallet"
   │
   ▼
┌────────────────────────────────────────┐
│  Frontend: Pre-Transaction Validation  │
│  POST /api/wallet/approvals/:id/validate│
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│  Backend: Check Idempotency Keys       │
│  For each recipient:                   │
│    key = SHA256(employer+employee+date)│
│    exists = find PayrollLog by key     │
│                                        │
│  allAlreadyPaid = all keys exist       │
│  someAlreadyPaid = some keys exist     │
└─────────────────┬──────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ All Paid?    │    │ Some Paid?   │
│ Reject!      │    │ Warn User!   │
└──────────────┘    └──────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ User Cancels │        │ User Proceeds│
        │ No TX!       │        │ Execute TX   │
        └──────────────┘        └──────┬───────┘
                                       │
                                       ▼
                            ┌────────────────────┐
                            │  MetaMask Opens    │
                            │  User Signs TX     │
                            │  Blockchain Execute│
                            └──────┬─────────────┘
                                   │
                                   ▼
                            ┌────────────────────┐
                            │  Always Create Log │
                            │  If duplicate:     │
                            │   - Modify key     │
                            │   - Flag metadata  │
                            │   - Still record   │
                            └────────────────────┘
```

### Idempotency System Details

**Purpose**: Prevent paying same employee twice on same day

**Implementation**:
```typescript
// Generate unique key per employee per day
const date = new Date().toISOString().split('T')[0]; // "2025-12-10"
const idempotencyKey = crypto
  .createHash('sha256')
  .update(`${employerId}-${employeeId}-${date}`)
  .digest('hex');

// Database constraint ensures uniqueness
model PayrollLog {
  idempotencyKey  String  @unique
}

// If duplicate transaction executed:
// - Modify key: originalKey + "-duplicate-" + timestamp
// - Flag in metadata: { isDuplicate: true }
// - Always create log (never skip!)
```

**Key Insight**: Once money sent on blockchain → MUST record in database, even if duplicate!

### Batch Transfer Architecture

**Smart Contract** (Solidity):
```solidity
contract SimpleBatchTransfer {
  function batchTransfer(
    address token,
    uint256 totalAmount,  // ← V2: Shows in MetaMask
    address[] calldata recipients,
    uint256[] calldata amounts
  ) external {
    // Validate sum matches totalAmount
    // Transfer from msg.sender to each recipient
  }
}
```

**Frontend Integration**:
```typescript
// 1. One-time approval
await ERC20.approve(batchContractAddress, maxUint256);

// 2. Execute batch transfer
const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);
await batchContract.batchTransfer(
  tokenAddress,
  totalAmount,
  recipients,
  amounts
);

// Result: Single MetaMask popup for all employees!
```

### Database Schema Updates

**PayrollLog** (Enhanced):
```prisma
model PayrollLog {
  id              String    @id @default(uuid())
  idempotencyKey  String    @unique  // ← Prevents duplicates
  metadata        Json?     // ← Enhanced structure

  // metadata contains:
  // {
  //   "approvalId": "...",
  //   "walletSigned": true,
  //   "isDuplicate": false,  // NEW: Flags duplicate payments
  //   "duplicateWarning": "...",  // NEW: Warning message
  //   "originalIdempotencyKey": "...",  // NEW: Original key
  //   "existingLogId": "..."  // NEW: Reference to original
  // }
}
```

### API Enhancements

**New Endpoints**:
1. `POST /api/wallet/approvals/:id/validate` - Pre-transaction validation
2. Enhanced `/api/payroll/run` - Duplicate checking before approval creation
3. Enhanced `/api/wallet/approvals/:id/submit` - Returns duplicate info

### Security Improvements

**Three-Layer Duplicate Prevention**:
1. **Layer 1** (Backend): Check before creating PayrollApproval
2. **Layer 2** (Frontend): Validate before MetaMask transaction
3. **Layer 3** (Backend): Always record, flag duplicates

**Benefits**:
- ✅ Prevents accidental double payments
- ✅ Saves gas fees from duplicate transactions
- ✅ Maintains complete audit trail
- ✅ Explicit user warnings
- ✅ Database = blockchain reality

### Performance Optimizations

**Batch Transfers**:
- Old: N transactions for N employees (N MetaMask popups)
- New: 1 transaction for N employees (1 MetaMask popup)
- Gas savings: ~80% for 10 employees

**Rate Limiting**:
- Development: 1000 req/15min (localhost exempt)
- Production: 100 req/15min

### Monitoring & Observability

**Logging Enhancements**:
- Winston structured logging (JSON format)
- Log levels: error, warn, info, debug
- Key events: duplicate detection, validation failures, transaction submission

**Database Queries**:
```sql
-- Find duplicate payments
SELECT * FROM "PayrollLog"
WHERE metadata->>'isDuplicate' = 'true';

-- Daily summary (detect doubles)
SELECT e.name, COUNT(*) as payments, SUM(amount) as total
FROM "PayrollLog" pl
JOIN "Employee" e ON e.id = pl."employeeId"
WHERE pl."executedAt" >= CURRENT_DATE
GROUP BY e.name
HAVING COUNT(*) > 1;
```

## Architecture Comparison

| Aspect | Original (MNEE-native) | Current (Ethereum) |
|--------|------------------------|-------------------|
| **Blockchain** | MNEE Network | Ethereum (Sepolia/Mainnet) |
| **Smart Contracts** | MNEE Flow (TypeScript) | Solidity |
| **Token** | MNEE Native Asset | ERC-20 MNEE Token |
| **Wallet** | MNEE WalletConnect | MetaMask + RainbowKit |
| **Agent Runtime** | MNEE Agent Runtime | Manual wallet signing |
| **Autonomy** | Fully autonomous | Requires wallet approval |
| **Custody** | Non-custodial | Non-custodial |
| **Duplicate Prevention** | Not implemented | 3-layer system ✅ |
| **Batch Transfers** | Not implemented | Smart contract V2 ✅ |
| **Validation** | Not implemented | Pre-transaction ✅ |

## Current System Capabilities

**Production-Ready Features**:
- ✅ Non-custodial wallet signing
- ✅ Duplicate payment prevention (3 layers)
- ✅ Batch transfer support
- ✅ Pre-transaction validation
- ✅ Complete audit trail
- ✅ Multi-tenant support
- ✅ MetaMask integration
- ✅ Rate limiting
- ✅ Error handling
- ✅ Structured logging

**Limitations**:
- ⚠️ Requires manual wallet approval (not fully autonomous)
- ⚠️ Desktop MetaMask only (no mobile wallet yet)
- ⚠️ Sepolia testnet only (mainnet deployment TBD)

## References

For detailed information, see:
- [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) - Complete system overview
- [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md) - Duplicate prevention deep dive
- [IDEMPOTENCY_KEY_EXPLAINED.md](IDEMPOTENCY_KEY_EXPLAINED.md) - Understanding idempotency
- [BATCH_CONTRACT_V2_UPGRADE.md](BATCH_CONTRACT_V2_UPGRADE.md) - Batch contract details
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation

---

**Last Updated**: December 10, 2025
**Architecture Version**: 2.0 (Ethereum-based)

