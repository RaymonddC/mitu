# API Reference - MNEE Autonomous Payroll

**Last Updated**: December 10, 2025
**Base URL**: `http://localhost:3001` (development) or your deployed backend URL
**API Version**: 2.0

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Employer Management](#employer-management)
  - [Employee Management](#employee-management)
  - [Payroll Execution](#payroll-execution)
  - [Wallet Signing](#wallet-signing)
  - [Balance & Budget](#balance--budget)
  - [Alerts](#alerts)
  - [System](#system)

---

## Authentication

Currently, the API uses wallet address-based authentication. No JWT or session tokens required.

**Authentication Method**: Wallet address verification
**Header Required**: None (address passed in request body/query)

---

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Human-readable error description"
}
```

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Usage |
|--------|---------|-------|
| `200` | OK | Successful request |
| `400` | Bad Request | Invalid input or duplicate operation |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |

### Common Error Messages

```json
// Duplicate payment attempt
{
  "error": "Payroll already executed today",
  "message": "All selected employees have already been paid today. Payroll can only be run once per day per employee.",
  "alreadyPaidEmployees": [...]
}

// Missing required field
{
  "error": "Missing required field",
  "message": "employerId is required"
}

// Resource not found
{
  "error": "Employer not found",
  "message": "No employer found with the provided wallet address"
}
```

---

## Rate Limiting

- **Development**: 1000 requests per 15 minutes (localhost exempt)
- **Production**: 100 requests per 15 minutes

**Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

---

## Endpoints

### Employer Management

#### Create/Register Employer

Creates a new employer account.

**Endpoint**: `POST /api/employers`

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "companyName": "Acme Corp",
  "monthlyBudget": 100000,
  "payrollDay": 28,
  "email": "employer@acme.com"  // optional
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "walletAddress": "0x742d35Cc...",
    "companyName": "Acme Corp",
    "monthlyBudget": 100000,
    "payrollDay": 28,
    "createdAt": "2025-12-10T10:00:00.000Z"
  },
  "message": "Employer registered successfully"
}
```

**Errors**:
- `400`: Wallet address already registered
- `400`: Invalid wallet address format

---

#### Get Employer by Wallet

Retrieves employer details with employees and alerts.

**Endpoint**: `GET /api/employers/:walletAddress`

**Parameters**:
- `walletAddress` (path): Employer's wallet address

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "walletAddress": "0x742d35Cc...",
    "companyName": "Acme Corp",
    "monthlyBudget": 100000,
    "payrollDay": 28,
    "employees": [
      {
        "id": "uuid",
        "name": "Alice Johnson",
        "walletAddress": "0xabc...",
        "salaryAmount": 3000,
        "active": true
      }
    ],
    "alerts": [
      {
        "id": "uuid",
        "severity": "warning",
        "title": "High Salary Alert",
        "message": "Employee salary exceeds $50,000",
        "resolved": false
      }
    ]
  }
}
```

**Errors**:
- `404`: Employer not found

---

### Employee Management

#### Add Employee

Adds a new employee to an employer.

**Endpoint**: `POST /api/employees`

**Request Body**:
```json
{
  "employerId": "uuid",
  "name": "Alice Johnson",
  "walletAddress": "0xabc123...",
  "salaryAmount": 3000,
  "email": "alice@example.com",  // optional
  "notes": "Remote worker"  // optional
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employerId": "uuid",
    "name": "Alice Johnson",
    "walletAddress": "0xabc123...",
    "salaryAmount": 3000,
    "active": true,
    "createdAt": "2025-12-10T10:00:00.000Z"
  },
  "message": "Employee added successfully"
}
```

**AI Guard Alerts**:
- If `salaryAmount > 50000`: Creates "High Salary" alert automatically

**Errors**:
- `400`: Employer not found
- `400`: Invalid wallet address
- `400`: Employee with this wallet already exists

---

#### Update Employee

Updates employee information.

**Endpoint**: `PUT /api/employees/:id`

**Request Body** (all fields optional):
```json
{
  "name": "Alice Smith",
  "salaryAmount": 3500,
  "email": "alice.smith@example.com",
  "active": true,
  "notes": "Promoted to senior"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alice Smith",
    "salaryAmount": 3500,
    "updatedAt": "2025-12-10T11:00:00.000Z"
  },
  "message": "Employee updated successfully"
}
```

**AI Guard Alerts**:
- If salary change > 50%: Creates "Suspicious Salary Change" alert

---

### Payroll Execution

#### Run Payroll

Creates a payroll approval request (non-custodial mode only).

**Endpoint**: `POST /api/payroll/run`

**Request Body**:
```json
{
  "employerId": "uuid",
  "employeeIds": ["uuid1", "uuid2"],  // optional, omit for all employees
  "testMode": false,  // optional
  "useWalletSigning": true  // always true (can be omitted)
}
```

**Response** (200) - Approval Required:
```json
{
  "success": true,
  "requiresApproval": true,
  "message": "Payroll approval created. Please approve with your wallet.",
  "data": {
    "approvalId": "uuid",
    "totalAmount": 15000,
    "recipientCount": 5,
    "expiresAt": "2025-12-10T10:15:00.000Z",
    "withinBudget": true,
    "alreadyPaidCount": 0  // Number of employees already paid today
  }
}
```

**Response** (400) - All Already Paid:
```json
{
  "error": "Payroll already executed today",
  "message": "All selected employees have already been paid today. Payroll can only be run once per day per employee.",
  "alreadyPaidEmployees": [
    { "name": "Alice", "amount": 3000, "paidAt": "2025-12-10T08:00:00.000Z" }
  ]
}
```

**Errors**:
- `400`: Employer not found
- `400`: No active employees
- `400`: All employees already paid today

---

#### Get Payroll History

Retrieves payroll execution history.

**Endpoint**: `GET /api/payroll/history`

**Query Parameters**:
- `employerId` (required): Employer UUID
- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "employeeId": "uuid",
        "employeeName": "Alice Johnson",
        "amount": 3000,
        "txHash": "0xabc123...",
        "status": "completed",
        "executedAt": "2025-12-10T08:00:00.000Z",
        "confirmedAt": "2025-12-10T08:01:00.000Z",
        "metadata": {
          "approvalId": "uuid",
          "walletSigned": true,
          "isDuplicate": false
        }
      }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### Retry Failed Payroll

Retries a failed payroll execution.

**Endpoint**: `POST /api/payroll/:logId/retry`

**Parameters**:
- `logId` (path): PayrollLog UUID

**Response** (200):
```json
{
  "success": true,
  "message": "Payroll retry initiated",
  "data": {
    "logId": "uuid",
    "retryCount": 1,
    "status": "retrying"
  }
}
```

**Errors**:
- `400`: Log not found or not failed
- `400`: Max retries exceeded (3 attempts)

---

### Wallet Signing

#### Create Payroll Approval

**Note**: Usually called automatically by `/api/payroll/run`. Can be called directly for manual approval creation.

**Endpoint**: `POST /api/wallet/approvals/create`

**Request Body**:
```json
{
  "employerId": "uuid",
  "employees": [
    {
      "id": "uuid",
      "name": "Alice",
      "walletAddress": "0xabc...",
      "salaryAmount": 3000
    }
  ]
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "approvalId": "uuid",
    "unsignedTx": {
      "type": "payroll",
      "recipients": [...],
      "totalAmount": 15000
    },
    "totalAmount": 15000,
    "recipientCount": 5,
    "expiresAt": "2025-12-10T10:15:00.000Z"
  }
}
```

---

#### Get Approval Details

Retrieves details of a specific approval.

**Endpoint**: `GET /api/wallet/approvals/:approvalId`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employerId": "uuid",
    "status": "pending",
    "unsignedTx": {...},
    "totalAmount": 15000,
    "recipientCount": 5,
    "recipients": [
      {
        "employeeId": "uuid",
        "name": "Alice",
        "address": "0xabc...",
        "amount": 3000
      }
    ],
    "expiresAt": "2025-12-10T10:15:00.000Z",
    "createdAt": "2025-12-10T10:00:00.000Z"
  }
}
```

---

#### List Pending Approvals

Retrieves all pending approvals for an employer.

**Endpoint**: `GET /api/wallet/approvals`

**Query Parameters**:
- `employerId` (required): Employer UUID
- `status` (optional): Filter by status (default: pending)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "pending",
      "totalAmount": 15000,
      "recipientCount": 5,
      "recipients": [...],
      "expiresAt": "2025-12-10T10:15:00.000Z",
      "createdAt": "2025-12-10T10:00:00.000Z"
    }
  ]
}
```

---

#### Validate Approval (Pre-Transaction)

**NEW!** Validates approval before blockchain transaction execution. Checks if employees were already paid today.

**Endpoint**: `POST /api/wallet/approvals/:approvalId/validate`

**Parameters**:
- `approvalId` (path): Approval UUID

**Response** (200) - Safe to Execute:
```json
{
  "success": true,
  "data": {
    "approvalId": "uuid",
    "valid": true,
    "allAlreadyPaid": false,
    "someAlreadyPaid": false,
    "totalRecipients": 5,
    "alreadyPaidCount": 0
  }
}
```

**Response** (200) - Some Already Paid:
```json
{
  "success": true,
  "data": {
    "approvalId": "uuid",
    "valid": false,
    "allAlreadyPaid": false,
    "someAlreadyPaid": true,
    "totalRecipients": 5,
    "alreadyPaidCount": 2,
    "alreadyPaidEmployees": [
      { "name": "Alice", "amount": 3000, "paidAt": "2025-12-10T08:00:00.000Z" },
      { "name": "Bob", "amount": 2500, "paidAt": "2025-12-10T08:00:00.000Z" }
    ]
  }
}
```

**Response** (400) - All Already Paid:
```json
{
  "error": "Approval not pending",
  "message": "Approval is approved. Only pending approvals can be validated."
}
```

**Errors**:
- `404`: Approval not found
- `400`: Approval not pending

---

#### Submit Signed Transaction

Submits the transaction hash after wallet signing. Creates PayrollLog records.

**Endpoint**: `POST /api/wallet/approvals/:approvalId/submit`

**Request Body**:
```json
{
  "txHash": "0xabc123..."  // Can be comma-separated for multiple: "0xabc,0xdef,0xghi"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "approvalId": "uuid",
    "txHash": "0xabc123...",
    "status": "approved",
    "approval": {...},
    "logsCreated": 5,
    "logsSkipped": 0,
    "createdLogs": [
      {
        "logId": "uuid",
        "employeeId": "uuid",
        "employeeName": "Alice",
        "amount": 3000,
        "isDuplicate": false
      }
    ],
    "skippedLogs": []
  },
  "message": "Transaction submitted successfully"
}
```

**Response** (200) - With Duplicates:
```json
{
  "success": true,
  "data": {
    "logsCreated": 5,
    "logsSkipped": 2,
    "createdLogs": [
      {
        "logId": "uuid",
        "employeeName": "Alice",
        "amount": 3000,
        "isDuplicate": true,  // ← Duplicate detected!
        "originalLogId": "previous-uuid"
      }
    ],
    "skippedLogs": [
      {
        "employeeName": "Alice",
        "amount": 3000,
        "reason": "Duplicate payment - already paid today"
      }
    ]
  },
  "message": "Transaction submitted successfully (with duplicates)"
}
```

**Errors**:
- `400`: Missing transaction hash
- `404`: Approval not found
- `400`: Approval not pending

---

#### Reject Approval

Rejects a pending approval.

**Endpoint**: `POST /api/wallet/approvals/:approvalId/reject`

**Request Body** (optional):
```json
{
  "reason": "Budget exceeded"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "approvalId": "uuid",
    "status": "rejected"
  },
  "message": "Approval rejected"
}
```

---

### Balance & Budget

#### Get Balance

Gets virtual balance for an employer (legacy, not used in non-custodial mode).

**Endpoint**: `GET /api/balance/:employerId`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "employerId": "uuid",
    "balance": 0,
    "companyName": "Acme Corp"
  }
}
```

---

#### Create Budget

Creates a pre-authorized budget for autonomous execution.

**Endpoint**: `POST /api/wallet/budgets`

**Request Body**:
```json
{
  "employerId": "uuid",
  "monthlyLimit": 50000,
  "perEmployeeLimit": 10000,  // optional
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employerId": "uuid",
    "monthlyLimit": 50000,
    "perEmployeeLimit": 10000,
    "usedThisMonth": 0,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "isActive": true
  },
  "message": "Budget created successfully"
}
```

---

#### Get Employer Budgets

Retrieves all budgets for an employer.

**Endpoint**: `GET /api/wallet/budgets/:employerId`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "monthlyLimit": 50000,
      "perEmployeeLimit": 10000,
      "usedThisMonth": 15000,
      "isActive": true,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

---

#### Check Budget Authorization

Checks if an amount is within authorized budget.

**Endpoint**: `POST /api/wallet/budgets/:employerId/check`

**Request Body**:
```json
{
  "amount": 15000
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "amount": 15000
  }
}
```

---

### Alerts

#### Get Alerts

Retrieves alerts for an employer.

**Endpoint**: `GET /api/alerts`

**Query Parameters**:
- `employerId` (required): Employer UUID
- `resolved` (optional): Filter by resolved status (true/false)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employerId": "uuid",
      "severity": "warning",
      "category": "high_salary",
      "title": "High Salary Alert",
      "message": "Employee Alice Johnson salary ($55,000) exceeds threshold",
      "metadata": {
        "employeeId": "uuid",
        "salaryAmount": 55000
      },
      "resolved": false,
      "createdAt": "2025-12-10T10:00:00.000Z"
    }
  ]
}
```

---

#### Resolve Alert

Marks an alert as resolved.

**Endpoint**: `PUT /api/alerts/:id/resolve`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "resolved": true,
    "resolvedAt": "2025-12-10T11:00:00.000Z"
  },
  "message": "Alert resolved"
}
```

---

### System

#### Health Check

Checks if the API is running.

**Endpoint**: `GET /health`

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-12-10T10:00:00.000Z",
  "uptime": 3600
}
```

---

#### Debug Payroll Count

**Development Only** - Counts PayrollLog records.

**Endpoint**: `GET /api/payroll/debug/count`

**Query Parameters**:
- `employerId` (optional): Filter by employer

**Response** (200):
```json
{
  "totalCount": 150,
  "latestLog": {
    "id": "uuid",
    "amount": 3000,
    "executedAt": "2025-12-10T08:00:00.000Z"
  },
  "recentLogs": [...]
}
```

---

## Code Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Run payroll
const response = await fetch(`${API_URL}/api/payroll/run`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employerId: 'uuid',
    useWalletSigning: true
  })
});

const data = await response.json();
if (data.success && data.requiresApproval) {
  // Redirect to approval page
  window.location.href = '/dashboard';
}
```

### Node.js (Backend)

```javascript
const axios = require('axios');

// Validate approval before transaction
const validation = await axios.post(
  `${API_URL}/api/wallet/approvals/${approvalId}/validate`
);

if (validation.data.data.allAlreadyPaid) {
  console.log('All employees already paid today!');
  return;
}

// Submit transaction
await axios.post(
  `${API_URL}/api/wallet/approvals/${approvalId}/submit`,
  { txHash: '0xabc123...' }
);
```

---

## Webhooks (Future)

Currently not implemented. Future versions will support webhooks for:
- Payroll approval created
- Transaction confirmed
- Payment failed
- Budget limit reached

---

## Changelog

### v2.0 (December 2025)
- Added `/api/wallet/approvals/:id/validate` endpoint
- Enhanced `/api/payroll/run` with duplicate detection
- Enhanced `/api/wallet/approvals/:id/submit` response with duplicate info
- Added `logsCreated`, `logsSkipped` fields to submit response

### v1.0 (November 2025)
- Initial release
- Non-custodial wallet signing endpoints
- Budget management
- Alert system

---

**For more information, see**:
- [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) - System architecture
- [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md) - Non-custodial mode details
- [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md) - Duplicate prevention system
