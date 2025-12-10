# What is an Idempotency Key?

## Simple Definition

**Idempotency Key** = A unique fingerprint that says "this exact operation was already done, don't do it again"

It's like a **ticket stub** that gets stamped "USED" - you can't use the same ticket twice.

## The Problem It Solves

### Without Idempotency Key:

```
User clicks "Pay Employees" → $15 sent to WilbertAnjing ✅
User clicks "Pay Employees" again → $15 sent AGAIN! ❌
User clicks "Pay Employees" again → $15 sent AGAIN! ❌

Result: WilbertAnjing got $45 instead of $15! 😱
```

### With Idempotency Key:

```
User clicks "Pay Employees" → Generate key "abc123..." → $15 sent ✅
User clicks "Pay Employees" again → Same key "abc123..." → BLOCKED! ❌
User clicks "Pay Employees" again → Same key "abc123..." → BLOCKED! ❌

Result: WilbertAnjing got $15 (correct!) ✅
```

## How It's Generated in Your System

### The Formula:

```javascript
const crypto = require('crypto');

// Inputs (3 pieces of information):
const employerId = "8f38deaf-3bb1-4258-b316-3fe2ed52848b"
const employeeId = "6b3c11d8-fcda-4504-8eec-2afc9c04cbee"
const date = "2025-12-10"

// Combine them:
const combined = `${employerId}-${employeeId}-${date}`
// Result: "8f38deaf-3bb1-4258-b316-3fe2ed52848b-6b3c11d8-fcda-4504-8eec-2afc9c04cbee-2025-12-10"

// Hash it (SHA256):
const idempotencyKey = crypto
  .createHash('sha256')
  .update(combined)
  .digest('hex')

// Result: "75677ab8f4c687a7e2c8b3d9f1e4a6c5..." (64 characters)
```

### What This Means:

The idempotency key represents:
- **WHO** is paying (employerId)
- **WHO** is getting paid (employeeId)
- **WHEN** (date - year/month/day only, no time!)

**Same employer + same employee + same day = SAME KEY**

## Real-World Examples

### Example 1: Same Day (Duplicate Detected)

```
Payment #1:
  Employer: Acme Corp (8f38deaf...)
  Employee: WilbertAnjing (6b3c11d8...)
  Date: 2025-12-10
  Time: 22:19:05

  Idempotency Key: 75677ab8f4c687a7e2c8b3d9f1e4a6c5...
  Action: CREATE PayrollLog ✅
  Result: $15 sent

Payment #2 (30 minutes later):
  Employer: Acme Corp (8f38deaf...)
  Employee: WilbertAnjing (6b3c11d8...)
  Date: 2025-12-10  ← SAME DATE!
  Time: 22:42:20    ← Different time, but doesn't matter!

  Idempotency Key: 75677ab8f4c687a7e2c8b3d9f1e4a6c5...  ← SAME KEY!
  Check database: KEY EXISTS! ❌
  Action: PREVENT DUPLICATE
  Result: Payment blocked
```

**Key insight**: Even though the time is different (22:19 vs 22:42), the date is the same, so the key is identical!

### Example 2: Next Day (New Payment Allowed)

```
Payment #1:
  Employer: Acme Corp (8f38deaf...)
  Employee: WilbertAnjing (6b3c11d8...)
  Date: 2025-12-10

  Idempotency Key: 75677ab8f4c687a7e2c8b3d9f1e4a6c5...
  Action: CREATE PayrollLog ✅

Payment #2 (Next day):
  Employer: Acme Corp (8f38deaf...)
  Employee: WilbertAnjing (6b3c11d8...)
  Date: 2025-12-11  ← DIFFERENT DATE!

  Idempotency Key: a6085a705a63db22c1b5d4e8f2a7b9d3...  ← DIFFERENT KEY!
  Check database: KEY NOT FOUND ✅
  Action: CREATE PayrollLog ✅
  Result: $15 sent
```

**Key insight**: Different date = different key = new payment allowed!

### Example 3: Same Day, Different Employee (Allowed)

```
Payment #1:
  Employer: Acme Corp (8f38deaf...)
  Employee: WilbertAnjing (6b3c11d8...)
  Date: 2025-12-10

  Idempotency Key: 75677ab8f4c687a7e2c8b3d9f1e4a6c5...
  Action: CREATE PayrollLog ✅

Payment #2:
  Employer: Acme Corp (8f38deaf...)
  Employee: gue (8df876d4...)  ← DIFFERENT EMPLOYEE!
  Date: 2025-12-10

  Idempotency Key: 3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f...  ← DIFFERENT KEY!
  Check database: KEY NOT FOUND ✅
  Action: CREATE PayrollLog ✅
  Result: $5 sent
```

**Key insight**: Different employee = different key = payment allowed (even on same day)!

## Database Storage

### Schema Definition:

```prisma
model PayrollLog {
  id              String    @id @default(uuid())
  employerId      String
  employeeId      String
  amount          Decimal
  idempotencyKey  String    @unique  // ← THE MAGIC CONSTRAINT!
  executedAt      DateTime  @default(now())
  // ...
}
```

That `@unique` constraint means:
- ✅ First PayrollLog with key "abc123..." → Created successfully
- ❌ Second PayrollLog with key "abc123..." → **DATABASE ERROR**: "Unique constraint failed on idempotencyKey"

### What's Stored:

```sql
-- First payment on Dec 10
INSERT INTO PayrollLog (
  idempotencyKey, employerId, employeeId, amount
) VALUES (
  '75677ab8f4c687a7...',  -- Key for Dec 10
  '8f38deaf...',
  '6b3c11d8...',
  15
);
-- Success! ✅

-- Try to insert duplicate (same key)
INSERT INTO PayrollLog (
  idempotencyKey, employerId, employeeId, amount
) VALUES (
  '75677ab8f4c687a7...',  -- SAME KEY!
  '8f38deaf...',
  '6b3c11d8...',
  15
);
-- ERROR: duplicate key value violates unique constraint ❌
```

## Why Use SHA256 Hash?

### Option 1: Simple String (Bad)

```javascript
idempotencyKey = `${employerId}-${employeeId}-${date}`
// Result: "8f38deaf-3bb1-4258-b316-3fe2ed52848b-6b3c11d8-fcda-4504-8eec-2afc9c04cbee-2025-12-10"

Problems:
✗ Very long (100+ characters)
✗ Reveals data (security concern)
✗ Inconsistent format (what if separator changes?)
✗ Database index inefficient
```

### Option 2: SHA256 Hash (Good!)

```javascript
idempotencyKey = crypto.createHash('sha256').update(combined).digest('hex')
// Result: "75677ab8f4c687a7e2c8b3d9f1e4a6c5..."

Benefits:
✓ Fixed length (always 64 characters)
✓ Same input → always same output (deterministic)
✓ Different input → always different output (unique)
✓ Fast database indexing
✓ Doesn't reveal original data (hashed)
✓ Industry standard for this use case
```

## Common Questions

### Q1: Why only use DATE and not TIME?

**A**: Because you want to prevent paying an employee twice **per day**, not twice per second.

```javascript
// With time (BAD):
idempotencyKey = hash(employerId + employeeId + "2025-12-10 22:19:05")
// If you run payroll at 22:42:20, it's a different key → duplicate payment! ❌

// With date only (GOOD):
idempotencyKey = hash(employerId + employeeId + "2025-12-10")
// Same day = same key = duplicate prevented ✅
```

### Q2: What if I want to pay a bonus on the same day?

**A**: You need a different idempotency strategy:

```javascript
// Option 1: Add payment type
idempotencyKey = hash(employerId + employeeId + date + paymentType)
// "regular" vs "bonus" → different keys

// Option 2: Use timestamp for bonus
idempotencyKey = hash(employerId + employeeId + date + timestamp)
// Each bonus gets unique key

// Option 3: Manual override (like we implemented)
// Generate modified key: "original-duplicate-1733756789"
```

### Q3: Can two different employees have the same key?

**A**: No! Because employeeId is part of the key.

```javascript
// Employee 1:
hash("employer123-employee456-2025-12-10") = "abc..."

// Employee 2:
hash("employer123-employee789-2025-12-10") = "xyz..."

Different employee → different key → different PayrollLog ✅
```

### Q4: What happens if I change the date format?

**A**: You must be consistent!

```javascript
// Wrong (different formats):
key1 = hash("emp-123-2025-12-10")  // ISO format
key2 = hash("emp-123-12/10/2025")  // US format
// Result: Different keys for same day! ❌

// Correct (consistent format):
const date = new Date().toISOString().split('T')[0]  // Always "YYYY-MM-DD"
key = hash("emp-123-" + date)
```

## Visualizing the Flow

```
┌─────────────────────────────────────────────────┐
│ User clicks "Run Payroll"                       │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ Generate idempotency key:                       │
│   employerId + employeeId + date                │
│   → hash → "75677ab8f4c687a7..."                │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ Check database:                                 │
│   SELECT * FROM PayrollLog                      │
│   WHERE idempotencyKey = '75677ab8...'          │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    ┌─────────┐            ┌─────────┐
    │ FOUND!  │            │NOT FOUND│
    │   ❌    │            │   ✅    │
    └────┬────┘            └────┬────┘
         │                      │
         ▼                      ▼
    ┌─────────────┐      ┌───────────────┐
    │ BLOCK       │      │ ALLOW         │
    │ Duplicate!  │      │ Create log    │
    │ Already paid│      │ Send payment  │
    └─────────────┘      └───────────────┘
```

## Real Code from Your System

### Generation (backend/src/services/walletSigningService.ts):

```typescript
const date = new Date().toISOString().split('T')[0]; // "2025-12-10"
const crypto = require('crypto');

const idempotencyKey = crypto
  .createHash('sha256')
  .update(`${approval.employerId}-${recipient.employeeId}-${date}`)
  .digest('hex');
```

### Check (same file):

```typescript
const existingLog = await prisma.payrollLog.findUnique({
  where: { idempotencyKey }
});

if (existingLog) {
  // Already paid! Don't pay again
  logger.warn('Duplicate payment detected!');
}
```

### Database Insert:

```typescript
await prisma.payrollLog.create({
  data: {
    idempotencyKey,  // The unique key
    employerId,
    employeeId,
    amount,
    status: 'completed'
  }
});
// If key already exists → Prisma throws error!
```

## Key Takeaways

1. **What**: Unique fingerprint for "this employee paid on this date"
2. **Why**: Prevents paying the same employee twice on the same day
3. **How**: SHA256 hash of employerId + employeeId + date
4. **When**: Checked before every payment
5. **Where**: Stored in PayrollLog table with `@unique` constraint

**Bottom Line**: It's your system's memory that says "we already did this exact thing today, don't do it again!" 🎯
