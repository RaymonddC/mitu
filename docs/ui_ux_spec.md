# MNEE Payroll + Autonomous Salary Agent
## UI / UX Specification

This document defines the full UI/UX structure for the MVP of **MNEE Payroll & Autonomous Salary Agent**. It includes navigation, flows, wireframes (text-based), component descriptions, and user interaction guidelines.

---

# 1. Design Principles
- **Crypto-friendly, not crypto-confusing** → clean, minimal terminology.
- **Trust & Transparency** → clear labels, audit logs, status indicators.
- **Simple Setup** → onboarding in under 3 minutes.
- **Automation-first UX** → agent suggestions appear everywhere.
- **Mobile-first** → optimized for small screens.

---

# 2. Core Pages

### 1. **Login / Connect Wallet**
- Choose wallet: MNEE Wallet (default), MetaMask (optional), WalletConnect
- CTA: **Connect Wallet**
- Secondary CTA: “What is MNEE Wallet?”

**UI Elements:**
- Hero icon
- Wallet card buttons
- "Connecting…" state

---

### 2. **Dashboard**
- Summary cards:
  - Total payroll this month
  - Number of employees
  - Next payday
- Quick actions:
  - Add Employee
  - Run Payroll
  - View Salary Agent Suggestions

**UI Components:**
- Card grid (3 cards)
- Suggestions panel
- Payroll status timeline

---

### 3. **Employees Page**
- Employee list table:
  - Avatar
  - Name
  - Wallet address
  - Salary amount
  - Token
  - Payday (DATE)
  - Status
  - Actions: Edit / Remove

- CTA: **Add Employee**

---

### 4. **Add Employee Modal**
**Fields:**
- Full name
- Wallet address (auto-validate)
- Monthly salary amount
- Token selector (MNEE / USDT / USDC / ETH)
- Payday selector
- Notes (optional)

**Agent Section:**
- "AI Agent Recommendation: 
  - Suggest token choice
  - Suggest salary based on region
  - Predict gas cost"

---

### 5. **Payroll Execution Page**
- Salary list preview
- Total payroll amount
- Gas estimate
- "Approve Transaction" button
- Success animation
- Receipt hash

**Success States:**
- Green checkmark
- Button: "View Transaction"

---

### 6. **Salary Agent Panel**
- Weekly analysis:
  - Underpaid risk
  - Overpaid risk
  - Wallet inactivity
  - Token volatility
  - Optimization tips

- CTA: "Apply Suggestion"

**UI Structure:**
- Vertical list of cards
- Severity tags: info / warning / urgent

---

### 7. **Settings Page**
- Organization name
- Default token
- Default payday
- Auto-pay toggle (future)
- Export data

---

# 3. Wireframes (ASCII-style)

### Dashboard
```
+--------------------------------------------------+
| MNEE Payroll Dashboard                           |
+---+-------------------+--------------------------+
|Tot| Employees         | Next Payday              |
|al |        12         | 26 Nov 2025              |
|Pa |-------------------|--------------------------|
|y  |  Add Employee  | Run Payroll | Suggestions  |
+--------------------------------------------------+
| Suggestions                                           |
| - Salary too low for 3 employees                      |
| - Token risk: USDT volatility                          |
+--------------------------------------------------------+
```

### Employee List
```
+-------------------------------------------------------------+
| Employees                                                   |
+-------------------------------------------------------------+
| Avatar | Name      | Wallet Address | Salary | Token | Edit |
|-------------------------------------------------------------|
|   o    | John Doe  | 0x8a...121     | 1000   | USDC  |  ✏️  |
|   o    | Jane Tan  | 0x71...AAA     | 800    | MNEE  |  ✏️  |
+-------------------------------------------------------------+
```

### Payroll Execution
```
+---------------------------------------------+
| Payroll Summary                             |
+---------------------------------------------+
| EMPLOYEE             | AMOUNT      | TOKEN  |
| John Doe             | 1000        | USDC   |
| Jane Tan             | 800         | MNEE   |
+---------------------------------------------+
| TOTAL: 1800                                   |
| GAS ESTIMATE: 0.0012 ETH                      |
+---------------------------------------------+
|        [ Approve & Pay ]                      |
+-----------------------------------------------+
```

---

# 4. Color Palette
- **Primary**: #1B5BF9 (MNEE blue)
- **Secondary**: #111827 (dark neutral)
- **Accents**: #22C55E (success), #F97316 (warning)
- **Background**: #F9FAFB
- **Cards**: #FFFFFF with shadow

---

# 5. Component Library
- **Buttons**: Solid + ghost + icon
- **Modals**: Rounded, blurred background
- **Table**: Sticky header, zebra rows
- **Input fields**: Floating labels
- **Cards**: Soft shadows, rounded-xl
- **Status pills**: green / orange / red

---

# 6. Interaction Guidelines
- Smooth transitions (0.15–0.25s)
- Confirmation modals before payments
- Tooltips on crypto terms
- Always show transaction hash on success
- Autosave form entries

---

# 7. Mobile Layout
- Bottom navigation (Dashboard / Employees / Agent / Settings)
- Sticky action button for “Add Employee”
- Collapsible cards

---

# 8. Asset Requirements
To be generated via AI:
- Logo (MNEE Payroll)
- Employee avatars
- Token icons (MNEE, USDT, USDC, ETH)
- UI illustrations:
  - Salary automation
  - Blockchain confirmation
  - AI agent analyzing payroll

---

# 9. Next Steps
- Add hi-fi mockups
- Generate component library using Figma AI
- Export design tokens for frontend

---

This file now contains the complete UI/UX specification for the MVP based entirely on MNEE, no ICP.
