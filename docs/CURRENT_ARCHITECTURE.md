# MNEE Autonomous Payroll - Current Architecture

**Date**: December 10, 2025
**Status**: Production-Ready
**Mode**: 100% Non-Custodial

---

## 🎯 System Overview

MNEE Autonomous Payroll is a **production-ready, non-custodial autonomous payroll system** built on Ethereum. Employers keep full control of their funds while the platform automates payroll scheduling, creates approval requests, and provides wallet-signing interfaces for secure transaction execution.

### Key Features
- ✅ **100% Non-Custodial** - Employers retain full custody of funds
- ✅ **Duplicate Payment Prevention** - Three-layer idempotency system
- ✅ **Batch Transfers** - Pay multiple employees in single transaction
- ✅ **Pre-Transaction Validation** - Checks before blockchain execution
- ✅ **Multi-Tenant** - Multiple employers on single platform
- ✅ **Autonomous Scheduling** - Detects payroll dates automatically
- ✅ **MetaMask Integration** - Seamless wallet connection

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- RainbowKit (wallet connection)
- wagmi + viem (Ethereum interaction)
- Tailwind CSS

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL 16
- Winston (logging)

**Blockchain:**
- Ethereum Sepolia (testnet)
- ERC-20 MNEE Token
- Batch Transfer Smart Contract (V2)

**DevOps:**
- Docker (PostgreSQL)
- npm workspaces (monorepo)

### System Diagram

```
┌──────────────────────────────────────────────────────┐
│                   User (Employer)                    │
│              MetaMask Wallet with MNEE               │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Dashboard   │  │   Payroll    │  │  Employees │ │
│  │    Page      │  │    Page      │  │    Page    │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│  ┌───────────────────────────────────────────────┐  │
│  │     WalletApproval Component                  │  │
│  │  - Validates before MetaMask                  │  │
│  │  - Batch or individual transfers              │  │
│  │  - Duplicate payment warnings                 │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────┘
                      │ API Calls
                      ▼
┌──────────────────────────────────────────────────────┐
│              Backend (Express)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │          Validation Layer                     │  │
│  │  - Pre-approval duplicate check               │  │
│  │  - Pre-transaction validation endpoint        │  │
│  │  - Idempotency key generation                 │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │          Business Logic                       │  │
│  │  - Wallet Signing Service                     │  │
│  │  - Payroll Controller                         │  │
│  │  - Employee Management                        │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │          Data Layer (Prisma)                  │  │
│  │  - PayrollApproval                            │  │
│  │  - PayrollLog (with idempotency key)          │  │
│  │  - Employee, Employer models                  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│  - Employee records                                  │
│  - Payroll logs with idempotency keys                │
│  - Approval requests                                 │
│  - Budget limits                                     │
└──────────────────────────────────────────────────────┘

                      ▲
                      │ Blockchain Transactions
                      ▼
┌──────────────────────────────────────────────────────┐
│         Ethereum Network (Sepolia/Mainnet)           │
│  ┌───────────────┐     ┌──────────────────────────┐ │
│  │  MNEE Token   │     │  Batch Transfer Contract │ │
│  │   (ERC-20)    │     │        (V2)              │ │
│  └───────────────┘     └──────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Payroll Flow

### Step-by-Step: From Click to Payment

**1. Employer Initiates Payroll**
```
User clicks "Run Payroll" button
   ↓
Frontend: POST /api/payroll/run
   ↓
Backend: Validates employees exist and active
```

**2. Duplicate Prevention Check (Layer 1)**
```
Backend checks each employee:
  - Generate idempotency key: SHA256(employerId + employeeId + date)
  - Query: SELECT * FROM PayrollLog WHERE idempotencyKey = ?
  - If all employees already paid → Reject with 400 error
  - If some already paid → Warning in response
```

**3. Create Approval Request**
```
Backend creates PayrollApproval:
  - status: 'pending'
  - recipients: [{employeeId, name, address, amount}, ...]
  - totalAmount: sum of all salaries
  - expiresAt: now + 15 minutes
  - Returns approvalId to frontend
```

**4. Frontend Shows Pending Approval**
```
User redirected to dashboard
   ↓
WalletApproval component fetches pending approvals
   ↓
Shows employee list, total amount, "Approve with Wallet" button
```

**5. Pre-Transaction Validation (Layer 2)**
```
User clicks "Approve with Wallet"
   ↓
Frontend: POST /api/wallet/approvals/:id/validate
   ↓
Backend checks AGAIN if employees already paid
   ↓
If all paid → Error: "Already paid today"
If some paid → Warning popup with names
   ↓
User can Cancel or Proceed
```

**6. Blockchain Transaction Execution**
```
If user proceeds:

Option A: Batch Mode (if approved batch contract)
  - Frontend encodes batch transfer call
  - Single MetaMask popup
  - walletClient.sendTransaction to batch contract
  - Batch contract executes all transfers

Option B: Individual Mode
  - Loop through each employee
  - Encode ERC-20 transfer for each
  - MetaMask popup for each transaction
  - walletClient.sendTransaction for each
```

**7. Record Transaction (Layer 3)**
```
Frontend: POST /api/wallet/approvals/:id/submit
  - body: { txHash: "0xabc123..." }

Backend:
  1. Update PayrollApproval: status = 'approved'
  2. For each employee:
     - Generate idempotency key
     - Check if exists
     - If exists → Modify key with timestamp (duplicate!)
     - ALWAYS create PayrollLog (never skip!)
     - If duplicate → Flag in metadata: { isDuplicate: true }
  3. Return: { logsCreated, logsSkipped, createdLogs[], skippedLogs[] }

Frontend:
  - If duplicates detected → Alert user
  - Refresh approval list
  - Show success message
```

---

## 🛡️ Duplicate Payment Prevention System

### Three Layers of Protection

#### Layer 1: Pre-Approval Creation Check
**File**: `backend/src/controllers/payrollController.ts`

```typescript
// Check if employees already paid today
const today = new Date().toISOString().split('T')[0];
for (const employee of employer.employees) {
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${employer.id}-${employee.id}-${today}`)
    .digest('hex');

  const existingLog = await prisma.payrollLog.findUnique({
    where: { idempotencyKey }
  });

  if (existingLog) {
    alreadyPaidEmployees.push(employee);
  }
}

// If ALL employees paid → Reject
if (alreadyPaidEmployees.length === allEmployees.length) {
  return res.status(400).json({
    error: 'Payroll already executed today'
  });
}
```

#### Layer 2: Pre-Transaction Validation
**Files**:
- Route: `backend/src/routes/walletSigning.ts`
- Controller: `backend/src/controllers/walletSigningController.ts`
- Frontend: `frontend/components/WalletApproval.tsx`

**Backend Endpoint:**
```typescript
POST /api/wallet/approvals/:approvalId/validate

// Checks if employees already paid
// Returns: { allAlreadyPaid, someAlreadyPaid, alreadyPaidEmployees[] }
```

**Frontend Check:**
```typescript
const validateResponse = await axios.post(
  `${API_URL}/api/wallet/approvals/${approval.id}/validate`
);

if (validation.allAlreadyPaid) {
  throw new Error('All employees already paid today!');
}

if (validation.someAlreadyPaid) {
  const confirmed = confirm(
    `WARNING: ${names} already paid!\n` +
    `Proceeding will create DUPLICATE PAYMENTS!`
  );
  if (!confirmed) return;
}

// Only now execute MetaMask transaction
await walletClient.sendTransaction(...);
```

#### Layer 3: Always Record Transactions
**File**: `backend/src/services/walletSigningService.ts`

```typescript
// Check if log exists
const existingLog = await prisma.payrollLog.findUnique({
  where: { idempotencyKey }
});

let finalIdempotencyKey = idempotencyKey;

if (existingLog) {
  // Transaction already executed on blockchain!
  // We MUST record it even if duplicate
  logger.error('DUPLICATE PAYMENT DETECTED');

  // Modify key to make it unique
  finalIdempotencyKey = `${idempotencyKey}-duplicate-${Date.now()}`;

  // Create log with duplicate flag
  await prisma.payrollLog.create({
    data: {
      idempotencyKey: finalIdempotencyKey,
      metadata: {
        isDuplicate: true,
        originalIdempotencyKey: idempotencyKey
      }
    }
  });
}
```

**See**: [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md) for complete details.

---

## 📦 Batch Transfer System

### Batch Contract V2

**Contract Address (Sepolia)**: `0xa3bBB8F74a548dfd13aB5c05Bc5c328cA087ABC7`

**Key Improvement**: V2 includes `totalAmount` parameter for MetaMask display

**Contract Interface:**
```solidity
function batchTransfer(
    address token,
    uint256 totalAmount,    // ← NEW: Shows in MetaMask
    address[] calldata recipients,
    uint256[] calldata amounts
) external
```

### How It Works

**1. User Approves Batch Contract (One-Time)**
```typescript
// Frontend: lib/batchApproval.ts
await approveBatchContract(walletClient, userAddress, tokenAddress);

// Under the hood:
// ERC-20.approve(batchContractAddress, type(uint256).max)
```

**2. Frontend Detects Approval**
```typescript
const approved = await checkBatchApproval(
  walletClient,
  userAddress,
  tokenAddress
);

if (approved) {
  // Enable batch mode automatically
  setUseBatchMode(true);
}
```

**3. Execute Batch Transfer**
```typescript
// Calculate total
const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);

// Encode call
const data = encodeFunctionData({
  abi: BATCH_TRANSFER_ABI,
  functionName: 'batchTransfer',
  args: [tokenAddress, totalAmount, recipients, amounts]
});

// Single transaction!
const hash = await walletClient.sendTransaction({
  to: batchContractAddress,
  data
});
```

**Benefits:**
- ✅ Single MetaMask popup (vs N popups)
- ✅ Lower gas fees
- ✅ Faster execution
- ✅ Better UX

**See**: [BATCH_CONTRACT_V2_UPGRADE.md](BATCH_CONTRACT_V2_UPGRADE.md) for deployment guide.

---

## 🗄️ Database Schema

### Key Models

#### PayrollLog
```prisma
model PayrollLog {
  id              String    @id @default(uuid())
  employerId      String
  employeeId      String
  amount          Decimal
  txHash          String?
  status          String    // "completed" | "failed"
  idempotencyKey  String    @unique  // ← Prevents duplicates
  executedAt      DateTime  @default(now())
  confirmedAt     DateTime?
  metadata        Json?     // { isDuplicate, approvalId, ... }

  employer        Employer  @relation(...)
  employee        Employee  @relation(...)

  @@index([employerId])
  @@index([employeeId])
  @@index([status])
  @@index([executedAt])
}
```

#### PayrollApproval
```prisma
model PayrollApproval {
  id              String    @id @default(uuid())
  employerId      String
  status          String    // "pending" | "approved" | "rejected" | "expired"
  unsignedTx      String?   // JSON of transaction data
  signedTx        String?   // Transaction hash after signing
  txHash          String?
  totalAmount     Decimal
  recipientCount  Int
  recipients      Json      // [{ employeeId, name, address, amount }, ...]
  expiresAt       DateTime
  approvedAt      DateTime?

  employer        Employer  @relation(...)

  @@index([employerId])
  @@index([status])
  @@index([expiresAt])
}
```

#### Idempotency Key Structure
```javascript
// Format: SHA256(employerId + employeeId + date)
const date = '2025-12-10';  // YYYY-MM-DD only (no time!)
const key = crypto
  .createHash('sha256')
  .update(`${employerId}-${employeeId}-${date}`)
  .digest('hex');

// Result: "75677ab8f4c687a7e2c8b3d9f1e4a6c5..."
```

**See**: [IDEMPOTENCY_KEY_EXPLAINED.md](IDEMPOTENCY_KEY_EXPLAINED.md)

---

## 🔌 API Endpoints

### Payroll Endpoints

**Run Payroll (Create Approval)**
```http
POST /api/payroll/run
Content-Type: application/json

{
  "employerId": "uuid",
  "employeeIds": ["uuid1", "uuid2"],  // Optional
  "useWalletSigning": true            // Always true
}

Response:
{
  "success": true,
  "requiresApproval": true,
  "message": "Payroll approval created",
  "data": {
    "approvalId": "abc-123",
    "totalAmount": 15000,
    "recipientCount": 5,
    "expiresAt": "2025-12-10T12:15:00Z"
  }
}
```

### Wallet Signing Endpoints

**Validate Approval (Pre-Transaction)**
```http
POST /api/wallet/approvals/:approvalId/validate

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "allAlreadyPaid": false,
    "someAlreadyPaid": true,
    "alreadyPaidEmployees": [
      { "name": "WilbertAnjing", "amount": 15, "paidAt": "..." }
    ]
  }
}
```

**Submit Signed Transaction**
```http
POST /api/wallet/approvals/:approvalId/submit
Content-Type: application/json

{
  "txHash": "0xabc123..."  // Can be comma-separated for multiple
}

Response:
{
  "success": true,
  "data": {
    "approvalId": "abc-123",
    "logsCreated": 2,
    "logsSkipped": 0,
    "createdLogs": [
      { "employeeId": "...", "employeeName": "...", "amount": 15 }
    ]
  }
}
```

**List Pending Approvals**
```http
GET /api/wallet/approvals?employerId=uuid

Response:
{
  "success": true,
  "data": [
    {
      "id": "abc-123",
      "status": "pending",
      "totalAmount": 15000,
      "recipientCount": 5,
      "recipients": [...],
      "expiresAt": "..."
    }
  ]
}
```

**See**: [API_REFERENCE.md](API_REFERENCE.md) for complete documentation.

---

## 🎨 Frontend Components

### Key Components

**1. WalletApproval Component**
- Location: `frontend/components/WalletApproval.tsx`
- Purpose: Shows pending approvals, handles wallet signing
- Features:
  - Auto-refresh every 30 seconds
  - Pre-transaction validation
  - Batch/individual mode toggle
  - Duplicate payment warnings
  - MetaMask integration

**2. Dashboard Page**
- Location: `frontend/app/dashboard/page.tsx`
- Sections:
  - Pending Approvals (top priority)
  - Budget Management
  - Summary Cards
  - Recent Activity

**3. Payroll Page**
- Location: `frontend/app/payroll/page.tsx`
- Features:
  - "Run Payroll" button
  - Payment history with refresh
  - Auto-refresh on visibility change

---

## 🔐 Security Features

### Non-Custodial Architecture
- ✅ Platform **never** holds private keys
- ✅ Platform **never** has custody of funds
- ✅ All transactions signed by user's wallet
- ✅ Blockchain-verifiable audit trail

### Idempotency System
- ✅ Prevents duplicate payments per day
- ✅ SHA256-based unique keys
- ✅ Database-enforced uniqueness
- ✅ Three-layer validation

### Pre-Transaction Validation
- ✅ Checks before blockchain execution
- ✅ Explicit user warnings
- ✅ Cancel option before MetaMask

### Duplicate Detection
- ✅ Records all transactions (even duplicates)
- ✅ Flags duplicates in metadata
- ✅ Alerts user immediately
- ✅ Full audit trail maintained

---

## 🚀 Deployment Architecture

### Development
```
localhost:3000  → Frontend (Next.js dev server)
localhost:3001  → Backend (Express)
localhost:5432  → PostgreSQL (Docker)
Sepolia Network → Ethereum testnet
```

### Production (Recommended)
```
Vercel          → Frontend (Next.js)
Railway/Render  → Backend (Express)
Railway/Render  → PostgreSQL (managed)
Mainnet         → Ethereum mainnet
```

### Environment Variables

**Backend (.env):**
```bash
DATABASE_URL="postgresql://..."
MNEE_API_KEY="your_api_key"              # From https://developer.mnee.net/
MNEE_ENVIRONMENT="sandbox"               # or "production"
MNEE_TOKEN_ADDRESS="0x..."               # ERC-20 MNEE token
EMPLOYER_PRIVATE_KEY="WIF_format"        # For server-side operations (if any)
PORT=3001
NODE_ENV="production"
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL="https://your-backend.com"
NEXT_PUBLIC_MNEE_TOKEN_ADDRESS="0x..."
NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS="0xa3bBB8..."
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"
```

---

## 📊 Monitoring & Logging

### Backend Logging
- Winston logger with JSON format
- Log levels: error, warn, info, debug
- Key events logged:
  - Payroll approval creation
  - Transaction submission
  - Duplicate payment detection
  - Validation failures

### Database Queries for Monitoring

**Check for Duplicate Payments:**
```sql
SELECT * FROM "PayrollLog"
WHERE metadata->>'isDuplicate' = 'true'
ORDER BY "executedAt" DESC;
```

**Daily Payment Summary:**
```sql
SELECT
  e.name,
  COUNT(pl.id) as payment_count,
  SUM(pl.amount) as total_paid
FROM "PayrollLog" pl
JOIN "Employee" e ON e.id = pl."employeeId"
WHERE pl."executedAt" >= CURRENT_DATE
GROUP BY e.name
HAVING COUNT(pl.id) > 1;  -- Show only paid more than once
```

**Pending Approvals:**
```sql
SELECT
  status,
  COUNT(*) as count,
  SUM("totalAmount") as total
FROM "PayrollApproval"
WHERE "expiresAt" > NOW()
GROUP BY status;
```

---

## 🔧 Development Workflow

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker run --name mnee-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine

# 3. Initialize database
cd backend
npx prisma migrate dev
npm run db:seed

# 4. Start development servers
cd ..
npm run dev  # Both backend and frontend
```

### Testing
```bash
# Run all tests
npm test

# Run demo script
./demo.sh

# Check database
node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  (async () => {
    const logs = await prisma.payrollLog.findMany({ take: 5 });
    console.log(logs);
    await prisma.\$disconnect();
  })();
"
```

---

## 📚 Additional Documentation

- [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md) - Deep dive into non-custodial architecture
- [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md) - Complete duplicate prevention guide
- [BATCH_CONTRACT_V2_UPGRADE.md](BATCH_CONTRACT_V2_UPGRADE.md) - Batch contract deployment
- [IDEMPOTENCY_KEY_EXPLAINED.md](IDEMPOTENCY_KEY_EXPLAINED.md) - Understanding idempotency
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [architecture.md](architecture.md) - Technical architecture details

---

## ✅ System Status Summary

**Production Readiness**: ✅ Ready

**Current Features:**
- ✅ Non-custodial wallet signing
- ✅ Duplicate payment prevention (3 layers)
- ✅ Batch transfer support (V2)
- ✅ Pre-transaction validation
- ✅ MetaMask integration
- ✅ Multi-tenant support
- ✅ Idempotency system
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Audit trail

**Known Limitations:**
- ⚠️ Manual approval required (not fully autonomous)
- ⚠️ Sepolia testnet only (mainnet deployment TBD)
- ⚠️ No mobile wallet support yet (desktop MetaMask only)

**Upcoming:**
- 🔜 Mobile wallet support (WalletConnect)
- 🔜 Multi-signature support
- 🔜 Scheduled approvals
- 🔜 Analytics dashboard

---

**Last Updated**: December 10, 2025
**System Version**: 2.0
**Architecture**: Non-Custodial + Batch Transfers + Duplicate Prevention
