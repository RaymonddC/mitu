# Testing Guide - MNEE Payroll with Risk Screening

This guide will help you test all the new UX improvements and risk screening features.

## Prerequisites

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application should be running at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### 2. Connect Your Wallet
1. Open http://localhost:3000 in your browser
2. Click "Connect Wallet" and connect with MetaMask
3. Make sure you're on Sepolia testnet (Chain ID: 11155111)

---

## Test Scenarios

### ✅ Test 1: Add Employee with Safe Wallet

**Purpose**: Test the automatic risk screening with a safe wallet address.

**Steps**:
1. Navigate to the **Employees** page
2. Click "Add Employee" button
3. Fill in the form:
   - **Name**: John Doe
   - **Email**: john@example.com (optional)
   - **Wallet Address**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0` (Safe wallet)
   - **Monthly Salary**: 1000
4. Wait for automatic risk checking (you'll see "Checking security...")

**Expected Results**:
- 🟢 Green border appears on wallet input field
- ✅ "Wallet Verified" message with green background
- Risk badge shows "Low Risk" with score
- "Add Employee" button is enabled
- You can successfully add the employee

---

### ⚠️ Test 2: Add Employee with Risky Wallet

**Purpose**: Test warning indicators for medium-risk wallets.

**Steps**:
1. Click "Add Employee" again
2. Fill in the form:
   - **Name**: Jane Smith
   - **Wallet Address**: Use a wallet with moderate activity (or create a new one)
   - **Monthly Salary**: 1500

**Expected Results**:
- 🟡 Yellow border appears on wallet input field
- ⚠️ "Proceed with Caution" warning message
- Risk badge shows risk level and score
- Toast notification appears with warning
- You can still add the employee (not blocked)

---

### 🚫 Test 3: Block High-Risk Wallet

**Purpose**: Test blocking of sanctioned/scam wallets.

**Steps**:
1. Click "Add Employee"
2. Try adding one of these **SANCTIONED WALLETS** (these are real sanctioned addresses):
   - **Tornado Cash Deployer**: `0x8589427373D6D84E98730D7795D8f6f8731FDA16`
   - **Lazarus Group**: `0x098B716B8Aaf21512996dC57EB0615e2383E2f96`
   - **OFAC Sanctioned**: `0x19Aa5Fe80D33a56D56c78e82eA5E50E5d80b4Dff`

**Expected Results**:
- 🔴 Red border appears on wallet input field
- 🚫 "Cannot Add Employee" error message
- Red risk badge with "Critical Risk" or "High Risk"
- Toast notification with destructive variant
- "Add Employee" button is **disabled**
- Cannot submit the form

---

### 🛡️ Test 4: Batch Employee Screening

**Purpose**: Test the payroll page risk screening for all employees.

**Steps**:
1. Navigate to **Payroll** page
2. Make sure you have at least 2-3 employees added
3. Click "Screen All Employees" button
4. Wait for screening to complete (you'll see spinner)

**Expected Results**:
- Loading spinner appears with "Screening..." text
- Risk results card appears with gradient header
- Summary statistics shown:
  - Total Scanned
  - Safe (green)
  - Warning (yellow)
  - Blocked (red)
- Each employee card shows:
  - Color-coded border (green/yellow/red)
  - Risk badge with score and summary
  - "BLOCKED" badge with pulse animation for high-risk employees
  - Pulsing alert icon for blocked employees
- Toast notification with summary

---

### 💡 Test 5: UI/UX Improvements

**Purpose**: Test all the new visual enhancements.

**What to Check**:

#### Employee Page:
- [ ] "Automatic Security Screening" banner appears when adding new employee
- [ ] Tooltips appear when hovering over ℹ️ icons
- [ ] Wallet input has dynamic colors (red/yellow/green) based on risk
- [ ] "Checking security..." indicator appears during risk check
- [ ] Action-specific guidance messages (Cannot Add/Proceed with Caution/Verified)
- [ ] Table rows have blue highlight on hover
- [ ] Edit button has blue background on hover
- [ ] Delete button has red background on hover with icon scale animation

#### Payroll Page:
- [ ] "Security First" banner recommends screening before payroll
- [ ] "Screen All Employees" button has scale animation on hover
- [ ] "Create Payroll Approval" button has scale animation on hover
- [ ] Risk results card has gradient header
- [ ] Summary stats grid is clear and readable
- [ ] Employee risk cards have smooth animations
- [ ] Blocked employees have pulsing 🚫 badge
- [ ] Tooltip on "Security Screening Results" explains the screening

---

## Test Data: Known Scam/Sanctioned Wallets

Use these for testing the blocking functionality:

### OFAC Sanctioned (Will be BLOCKED):
```
0x098B716B8Aaf21512996dC57EB0615e2383E2f96  # Lazarus Group
0x19Aa5Fe80D33a56D56c78e82eA5E50E5d80b4Dff  # OFAC SDN
0x2f389ce8bd8ff92de3402ffce4691d17fc4f6535  # Tornado Cash Router
0x722122dF12D4e14e13Ac3b6895a86e84145b6967  # North Korea Hacker
0x76D85B4C0Fc497EeCc38902397aC608000A06607  # Money Laundering
```

### Tornado Cash Addresses (Will be BLOCKED):
```
0x8589427373D6D84E98730D7795D8f6f8731FDA16  # Tornado Cash: 0.1 ETH
0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b  # Tornado Cash: 1 ETH
0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF  # Tornado Cash: 10 ETH
```

### Test Safe Wallets (Will PASS):
```
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0  # Vitalik Buterin
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  # vitalik.eth
```

---

## API Endpoints for Testing

You can also test the risk screening API directly:

### Screen Single Wallet:
```bash
curl -X POST http://localhost:3001/api/risk/screen \
  -H "Content-Type: application/json" \
  -d '{"address": "0x098B716B8Aaf21512996dC57EB0615e2383E2f96"}'
```

### Screen All Employees:
```bash
curl -X POST http://localhost:3001/api/risk/screen-employees \
  -H "Content-Type: application/json" \
  -d '{"employerId": "YOUR_EMPLOYER_ID"}'
```

### Check Sanctions:
```bash
curl http://localhost:3001/api/risk/sanctions/0x098B716B8Aaf21512996dC57EB0615e2383E2f96
```

### Get Risk Stats:
```bash
curl http://localhost:3001/api/risk/stats
```

---

## Troubleshooting

### Backend Not Starting:
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill the process if needed
taskkill /F /PID <PID>

# Restart backend
cd backend && npm run dev
```

### Frontend Not Starting:
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill and restart
cd frontend && npm run dev
```

### RPC Errors:
- Make sure your Infura API key is correct in `.env`
- Check that you're on Sepolia testnet (Chain ID: 11155111)
- Try the public RPC if Infura is having issues: `https://rpc.sepolia.org`

### Risk Screening Not Working:
- Check backend logs for errors
- Verify Etherscan API key is set: `ETHERSCAN_API_KEY="HVENWVAHC39KDRDV1A4AMWH414J8E7U2ZR"`
- Check that the RPC connection is working
- Clear risk cache: `POST http://localhost:3001/api/risk/cache/clear`

---

## Expected Behavior Summary

| Risk Level | Color | Border | Action | Can Add? |
|-----------|-------|--------|--------|----------|
| Low (0-30) | 🟢 Green | Green | Proceed | ✅ Yes |
| Medium (31-60) | 🟡 Yellow | Yellow | Warn | ⚠️ Yes with warning |
| High (61-80) | 🟠 Orange | Orange | Warn | ⚠️ Yes with warning |
| Critical (81-100) | 🔴 Red | Red | Block | 🚫 No |
| Sanctioned | 🔴 Red | Red | Block | 🚫 No |

---

## What to Look For

### ✅ Good Signs:
- Smooth animations and transitions
- Clear color coding (green/yellow/red)
- Helpful tooltips and guidance messages
- Real-time risk checking
- Proper blocking of sanctioned wallets
- Clean, professional UI

### ❌ Issues to Report:
- Risk screening not triggering automatically
- Incorrect color coding
- Missing animations or tooltips
- Blocked wallets can still be added
- API errors in console
- Slow performance

---

## Next Steps After Testing

Once you've verified everything works:

1. **Test with Real Users**: Have team members test the flow
2. **Performance Check**: Monitor API response times for risk screening
3. **Edge Cases**: Test with various wallet formats and invalid addresses
4. **Mobile Testing**: Check responsiveness on mobile devices
5. **Error Handling**: Test network failures and API errors

---

## Support

If you encounter any issues during testing:
1. Check the browser console for errors
2. Check backend terminal for API errors
3. Verify all environment variables are set correctly
4. Make sure PostgreSQL database is running
5. Ensure you're on Sepolia testnet in MetaMask

Happy Testing! 🚀
