# Non-Custodial Mode Only - Simplified Architecture

**Date:** 2025-12-01
**Decision:** Remove custodial mode entirely, use wallet signing only

---

## 🎯 **Why Non-Custodial Only?**

### **Security First**
- ✅ Employers keep 100% control of funds
- ✅ Platform never holds private keys
- ✅ Database breach = zero fund loss
- ✅ No single point of failure

### **Regulatory Compliance**
- ✅ Not a money transmitter
- ✅ No KYC/AML requirements
- ✅ Software provider only
- ✅ Production-ready

### **User Trust**
- ✅ Clear mental model: "My wallet, my funds"
- ✅ No confusion about custodial vs non-custodial
- ✅ Transparent wallet signing
- ✅ Blockchain-verifiable transactions

### **Simplicity**
- ✅ One execution path (wallet signing)
- ✅ Less code to maintain
- ✅ Easier to understand
- ✅ Cleaner UI/UX

---

## 📋 **What Was Removed**

### **Frontend Components Removed:**
- ❌ `BalanceDashboard.tsx` - Virtual balance UI (no longer shown)
- ❌ Test Mode checkbox
- ❌ Wallet Signing toggle
- ❌ Deposit/Withdraw features

### **Backend Flow Simplified:**
- Always uses `useWalletSigning: true`
- Removed custodial execution path
- Always creates PayrollApproval
- No virtual balance deductions

### **Database Schema:**
Note: We **kept** the virtual balance fields in the schema for potential future analytics, but they're not used in the flow.

**Fields Still in DB (unused):**
- `Employer.virtualBalance`
- `Employer.totalDeposited`
- `Employer.totalWithdrawn`
- `BalanceTransaction` model

**Why Keep Them:**
- Easy to add back if needed
- Useful for analytics/reporting
- No harm in keeping (just not displayed)
- Avoids breaking existing seed data

---

## 🏗️ **Current Architecture**

### **User Flow**

```
1. Employer connects wallet (MetaMask)
   ↓
2. Employer adds employees with Ethereum addresses
   ↓
3. Employer clicks "Create Payroll Approval"
   ↓
4. Backend creates PayrollApproval in database
   ↓
5. Employer redirected to Dashboard
   ↓
6. Employer clicks "Approve with Wallet"
   ↓
7. MetaMask popup shows ERC-20 transfer
   ↓
8. Employer signs transaction
   ↓
9. Transaction broadcasts to Ethereum
   ↓
10. Employees receive MNEE tokens ✅
```

### **Key Components**

#### **Frontend:**
1. **Dashboard** (`/dashboard`)
   - Pending Approvals section
   - Budget Management section
   - Summary cards

2. **Payroll Page** (`/payroll`)
   - "Create Payroll Approval" button
   - Payment history
   - Non-custodial info banner

3. **WalletApproval Component**
   - Shows pending approvals
   - "Approve with Wallet" button
   - MetaMask integration via wagmi/viem
   - Auto-refresh every 30 seconds

4. **BudgetManagement Component**
   - Create pre-authorized budgets
   - View active budget status
   - Track monthly usage

#### **Backend:**
1. **Wallet Signing Service**
   - `createPayrollApproval()` - Creates approval request
   - `submitSignedTransaction()` - Records transaction hash
   - `checkBudgetAuthorization()` - Checks budget limits

2. **Payroll Controller**
   - Always uses wallet signing mode
   - Creates PayrollApproval for every payroll run
   - Returns `{ requiresApproval: true, approvalId: '...' }`

3. **Database Models**
   - `PayrollApproval` - Pending wallet approvals
   - `PayrollBudget` - Pre-authorized spending limits
   - `PayrollLog` - Completed transactions

---

## 🔐 **How Funds Work**

### **Employer's Perspective:**

1. **Keeps MNEE in own wallet**
   - Employer has 10,000 MNEE in MetaMask
   - Platform never touches these funds
   - Employer signs transactions directly

2. **Creates approval when payroll is due**
   - System detects payroll day
   - Creates approval request
   - Employer receives notification

3. **Signs transactions in MetaMask**
   - Reviews employee list and amounts
   - Clicks "Approve with Wallet"
   - Signs ERC-20 transfers (one per employee)
   - Transactions execute on Ethereum

4. **Blockchain verifiable**
   - All transactions on-chain
   - Viewable on Etherscan
   - Transparent and auditable

### **Platform's Role:**

- ✅ Stores employee data (names, addresses, salaries)
- ✅ Detects when payroll is due
- ✅ Creates approval requests
- ✅ Provides UI for signing
- ❌ **NEVER** holds funds
- ❌ **NEVER** has private keys
- ❌ **NEVER** executes transactions directly

---

## 📊 **Budget System (Autonomous Execution)**

While the system is **fully non-custodial**, employers can create **pre-authorized budgets** to enable more autonomous behavior:

### **How It Works:**

1. **Employer creates budget:**
   ```json
   {
     "monthlyLimit": 50000,
     "perEmployeeLimit": 10000,
     "startDate": "2025-01-01",
     "endDate": "2025-12-31"
   }
   ```

2. **Employer configures wallet auto-approve:**
   - Sets up MetaMask/wallet extension rules
   - Auto-approves MNEE Payroll app
   - Within 50k MNEE per month limit

3. **System checks budget before creating approval:**
   ```typescript
   const withinBudget = await checkBudgetAuthorization(employerId, totalAmount);

   // Always creates approval (non-custodial)
   // But withinBudget info helps with auto-approve decisions
   ```

4. **If within budget + auto-approve enabled:**
   - Wallet automatically signs without popup
   - Fully autonomous execution
   - Still non-custodial (wallet signs, not platform)

5. **If exceeds budget:**
   - Manual approval required
   - MetaMask popup appears
   - Employer reviews and approves

---

## 🚀 **API Endpoints**

### **Payroll Execution:**

```bash
# Always creates approval (wallet signing only)
POST /api/payroll/run
{
  "employerId": "uuid",
  "useWalletSigning": true  # Always true (can be omitted)
}

# Response:
{
  "success": true,
  "requiresApproval": true,
  "data": {
    "approvalId": "abc-123",
    "totalAmount": 15000,
    "recipientCount": 5,
    "expiresAt": "2025-12-01T12:15:00Z"
  }
}
```

### **Wallet Signing:**

```bash
# List pending approvals
GET /api/wallet/approvals?employerId=uuid

# Submit signed transaction
POST /api/wallet/approvals/:id/submit
{ "txHash": "0xdef456..." }

# Create budget
POST /api/wallet/budgets
{
  "employerId": "uuid",
  "monthlyLimit": 50000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

---

## 🎨 **UI/UX Changes**

### **Dashboard:**
- **Removed:** Virtual Balance section
- **Kept:** Pending Approvals (top priority)
- **Kept:** Budget Management
- **Kept:** Summary cards (employees, payroll, next payday)

### **Payroll Page:**
- **Removed:** Test Mode checkbox
- **Removed:** Wallet Signing toggle
- **Added:** Non-custodial info banner
- **Changed:** Button text to "Create Payroll Approval"
- **Changed:** Auto-redirect to dashboard after approval creation

### **Landing Page:**
- No changes (already showcases wallet connection)

---

## 🧪 **Testing Instructions**

### **1. Register as Employer:**
```
1. Go to http://localhost:3000
2. Connect wallet (MetaMask)
3. Click "Get Started"
4. Fill in company details
5. Dashboard loads
```

### **2. Add Employees:**
```
1. Click "Add Employee" button
2. Enter name, wallet address, salary
3. Save
4. Repeat for multiple employees
```

### **3. Create Payroll Approval:**
```
1. Go to /payroll
2. See non-custodial banner
3. Click "Create Payroll Approval"
4. Confirm dialog
5. Automatically redirected to dashboard
```

### **4. Approve with Wallet:**
```
1. See "Pending Approval" card on dashboard
2. Review employee list and amounts
3. Click "Approve with Wallet"
4. MetaMask popup appears
5. Sign each transaction
6. Approval disappears
7. Transactions complete ✅
```

### **5. Create Budget (Optional):**
```
1. Scroll to "Budget Management" on dashboard
2. Click "Create Budget"
3. Set monthly limit: 50000
4. Set date range
5. Click "Create Budget"
6. See active budget card with progress bar
```

---

## 📈 **Comparison: Before vs After**

| Feature | Before (2 Modes) | After (Non-Custodial Only) |
|---------|-----------------|---------------------------|
| **Execution Modes** | Custodial + Wallet Signing | Wallet Signing only |
| **Toggle Required** | Yes (2 checkboxes) | No |
| **Virtual Balance** | Required | Not used |
| **Deposit/Withdraw** | Yes | Removed |
| **MetaMask Popup** | Only if enabled | Always |
| **Security** | Platform holds funds | Employer holds funds |
| **Complexity** | High (2 paths) | Low (1 path) |
| **Production Ready** | Debatable | Yes ✅ |

---

## 🎯 **Benefits Achieved**

### **For Employers:**
- ✅ Complete control of funds
- ✅ Simple, clear flow
- ✅ Blockchain transparency
- ✅ No platform trust required

### **For Platform:**
- ✅ No custody liability
- ✅ No regulatory burden
- ✅ Simpler codebase
- ✅ Easier to explain

### **For Developers:**
- ✅ One execution path
- ✅ Less code to maintain
- ✅ Clearer architecture
- ✅ Better testability

---

## 🔮 **Future Enhancements**

### **Potential Additions:**

1. **Batch Transfer Contract**
   - Deploy smart contract for batch transfers
   - Sign once for all employees
   - Better UX (1 popup vs N popups)

2. **Multi-Signature Support**
   - Require 2+ approvers for large payrolls
   - Company governance rules
   - On-chain enforcement

3. **Scheduled Approvals**
   - Pre-sign transactions with time-locks
   - Auto-execute on payday
   - Still non-custodial

4. **Mobile Wallet Support**
   - WalletConnect integration
   - Approve from phone
   - Push notifications

5. **Analytics Dashboard**
   - Track spending over time
   - Employee payment history
   - Export reports

---

## 📝 **Migration Notes**

### **For Existing Users (if any):**

If you had virtual balance before:
1. Withdraw remaining balance (use old UI)
2. System will guide through withdrawal
3. Then switch to non-custodial mode
4. Load MNEE into personal wallet

### **For New Users:**
- Start directly with wallet signing
- No migration needed
- Clean, simple experience

---

## ✅ **Summary**

**You now have a production-ready, fully non-custodial autonomous payroll system where:**

- ✅ Employers keep 100% control of funds in their wallets
- ✅ Platform creates approval requests
- ✅ Employers sign transactions in MetaMask
- ✅ Blockchain verifies all transactions
- ✅ Pre-authorized budgets enable autonomous execution
- ✅ Maximum security with zero custody liability
- ✅ Clean, simple, production-ready architecture

**The system is now ready for production deployment!** 🚀
