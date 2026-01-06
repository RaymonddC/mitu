# New Features - Recent Updates

This document outlines the latest features added to the MNEE Autonomous Payroll platform.

---

## 🏢 Multi-Company Support

**Added:** December 2024
**Status:** ✅ Production Ready

### Overview

Single wallet addresses can now manage multiple companies, each with separate employee rosters, settings, and payroll schedules.

### Key Features

- **Multiple Companies per Wallet**: Connect one MetaMask wallet and create unlimited companies
- **Separate Employee Rosters**: Each company has its own employee list
- **Independent Settings**: Each company can have different:
  - Payroll day
  - Monthly budget
  - Company branding
  - Payment methods
- **Company Switching**: Easy dropdown to switch between companies in the navigation

### Technical Implementation

**Database Schema Changes:**
- Removed `@unique` constraint from `Employer.walletAddress` (prisma/schema.prisma:17)
- Added `@@index([walletAddress])` for efficient querying
- Each employer record represents one company

**Frontend:**
- Company selector in navigation (components/Navigation.tsx)
- Store updated to handle multiple companies (lib/store.ts)
- API calls include `employerId` to differentiate companies

**Backend:**
- Updated employer endpoints to support multiple companies per wallet
- Added company creation endpoint: `POST /api/employers`
- Modified queries to filter by both wallet AND employerId

### User Flow

1. User connects wallet
2. If first time: Auto-creates default company
3. User can create additional companies via Settings
4. Company dropdown appears in navigation when multiple companies exist
5. All pages (dashboard, employees, payroll) scoped to selected company

### API Changes

**GET /api/employers/:walletAddress**
- Now returns array of all companies for this wallet
- Frontend selects first company by default

**POST /api/employers**
```json
{
  "walletAddress": "0x...",
  "companyName": "My Second Company"
}
```

---

## 🎨 Company Customization

**Added:** December 2024
**Status:** ✅ Production Ready

### Overview

Companies can now customize their branding with logo upload and company information.

### Key Features

- **Logo Upload**: Upload company logo (PNG, JPG, SVG)
- **Company Name**: Set custom company name
- **Profile Images**: Support for both company and employee profile pictures
- **Visual Branding**: Logo appears in navigation and dashboard

### Technical Implementation

**Database Schema:**
- `Employer.profileImage` (String) - Stores base64 or URL
- `Employee.profileImage` (String) - Employee profile pictures

**Frontend Component:**
- `components/CompanyCustomization.tsx` - Full customization UI
- Image upload with preview
- Base64 encoding for storage
- File size validation (max 2MB recommended)

**Settings Page:**
- New "Company" tab in Settings (app/settings/page.tsx)
- Tabbed interface: "Company" and "Payments"
- Real-time preview of changes

### User Flow

1. Go to Settings → Company tab
2. Click "Upload Logo" or drag-and-drop image
3. Preview appears instantly
4. Click "Save Changes"
5. Logo appears in navigation immediately

### Image Storage

**Current Implementation:**
- Images stored as base64 in PostgreSQL
- Encoded on frontend before sending to backend
- Decoded for display

**Future Optimization:**
- Consider cloud storage (S3, Cloudinary) for large-scale deployments
- Use CDN for faster loading
- Image optimization (resize, compress)

### API Endpoints

**PATCH /api/employers/:id**
```json
{
  "companyName": "New Company Name",
  "profileImage": "data:image/png;base64,..."
}
```

---

## 💰 Budget Management

**Added:** December 2024
**Status:** ✅ Production Ready

### Overview

Set monthly spending limits with visual budget tracking, warnings, and real-time updates.

### Key Features

- **Monthly Budget Limits**: Set maximum spending per month
- **Visual Progress Bar**: See budget utilization at a glance
- **Budget Warnings**: Alert when approaching or exceeding budget
- **Budget Reset**: Automatically resets each month
- **Real-time Tracking**: Updates immediately after payroll

### Technical Implementation

**Database Schema:**
- `Employer.monthlyBudget` (Decimal) - Monthly spending cap
- `PayrollBudget` model for advanced budget features (planned)

**Frontend Components:**
- `components/BudgetManagement.tsx` - Budget settings modal
- Visual progress indicator
- Color-coded warnings (green, yellow, red)
- Budget utilization percentage

**Dashboard Integration:**
- Budget card shows current spending vs limit
- Warning badges when over budget
- Quick link to adjust budget

### Budget Calculation

```typescript
// Calculate total spending this month
const totalSpent = await prisma.payrollLog.aggregate({
  where: {
    employerId: employerId,
    executedAt: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
    status: 'completed',
  },
  _sum: { amount: true },
});

// Check if over budget
const percentUsed = (totalSpent / monthlyBudget) * 100;
if (percentUsed >= 100) {
  // Show critical warning
} else if (percentUsed >= 80) {
  // Show warning
}
```

### User Flow

1. Go to Dashboard or Settings
2. Click "Set Budget" or "Manage Budget"
3. Modal opens with budget input
4. Enter monthly budget (in MNEE)
5. Save and see immediate visual update
6. Budget warnings appear when running payroll

### AI Guard Integration

Budget management integrates with AI Guard to:
- **Prevent overspending**: Warns before payroll if budget exceeded
- **Smart alerts**: Suggests budget adjustments based on actual usage
- **Historical tracking**: Compares current month vs previous months

### API Endpoints

**PATCH /api/employers/:id**
```json
{
  "monthlyBudget": "50000.00"
}
```

**GET /api/employers/:id/budget-status**
```json
{
  "monthlyBudget": "50000.00",
  "spentThisMonth": "35000.00",
  "percentUsed": 70,
  "remainingBudget": "15000.00",
  "status": "ok" // or "warning" or "critical"
}
```

---

## 🎨 Enhanced Settings Dashboard

**Added:** December 2024
**Status:** ✅ Production Ready

### Overview

Redesigned settings page with tabbed interface for better organization and user experience.

### Key Features

- **Tabbed Interface**: Separate tabs for Company and Payments
- **Company Tab**:
  - Company customization (logo, name)
  - Company information display
- **Payments Tab**:
  - Batch transfer settings
  - Approval management
  - Gas savings calculator
- **Improved Navigation**: Clear visual separation of concerns
- **Responsive Design**: Works on mobile and desktop

### Technical Implementation

**Component Structure:**
```
app/settings/page.tsx
├── TabType: 'company' | 'payments'
├── Company Tab
│   └── CompanyCustomization component
└── Payments Tab
    ├── Batch transfer status
    ├── Approval buttons
    └── Cost comparison
```

**State Management:**
- `activeTab` state controls which tab is visible
- Tab switching preserves form state
- Real-time updates when settings change

### User Experience Improvements

1. **Visual Hierarchy**: Icons and headings make sections clear
2. **Contextual Help**: Info tooltips explain complex features
3. **Action Feedback**: Loading states and success messages
4. **Error Handling**: Clear error messages for failed operations

---

## 🔄 Environment Configuration Updates

**Added:** December 2024
**Status:** ✅ Production Ready

### Overview

Improved environment variable management with separate development and production configurations.

### Key Changes

**Backend:**
- `.env.development` - Development configuration
- `.env.production` - Production configuration
- Scripts automatically load correct env file:
  - `npm run dev` → `.env.development`
  - `npm run dev:prod` → `.env.production`
  - `npm start` → Uses system environment

**Frontend:**
- `.env.local.example` - Template for local development
- Clear documentation for all required variables

**Docker Compose:**
- Updated environment variables for Ethereum
- Removed deprecated MNEE Network variables
- Added batch transfer contract support

### New Environment Variables

**Backend:**
```env
BATCH_TRANSFER_CONTRACT_ADDRESS=""  # Optional
JWT_SECRET="..."
SESSION_SECRET="..."
```

**Frontend:**
```env
NEXT_PUBLIC_BATCH_TRANSFER_CONTRACT_ADDRESS=""
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."
WALLETCONNECT_PROJECT_ID="..."  # For Docker Compose
```

### Migration from Old Setup

If upgrading from earlier versions:

1. **Rename environment files:**
   ```bash
   mv backend/.env backend/.env.development
   ```

2. **Add new variables:**
   - Copy from `.env.example`
   - Add BATCH_TRANSFER_CONTRACT_ADDRESS
   - Add WALLETCONNECT_PROJECT_ID

3. **Update scripts:**
   - Scripts now use `dotenv-cli` for env file loading
   - No changes needed - works automatically

---

## 📱 UI/UX Improvements

**Added:** December 2024
**Status:** ✅ Production Ready

### Dashboard Enhancements

- **Company Logo**: Displays in navigation and dashboard header
- **Budget Visualization**: Progress bars and percentage indicators
- **Responsive Layout**: Better mobile experience
- **Loading States**: Skeleton loaders for better perceived performance

### Settings Page Redesign

- **Tabbed Navigation**: Logical grouping of settings
- **Visual Consistency**: Uses shadcn/ui components throughout
- **Better Spacing**: Improved readability and visual hierarchy
- **Icon Usage**: Intuitive icons for actions (Building2, DollarSign, etc.)

### Navigation Updates

- **Company Selector**: Dropdown to switch between companies
- **Active State**: Clear indication of current page
- **Logo Display**: Company logo in header (when set)
- **Mobile Menu**: Improved mobile navigation

---

## 🔮 Upcoming Features

Features currently in development or planned:

### Q1 2025

- [ ] **Autonomous Payroll Execution**: Smart contracts with monthly spending limits
- [ ] **Account Abstraction**: Session keys for gasless transactions
- [ ] **Multi-Signature Support**: 2-of-3 approval for large payrolls
- [ ] **Enhanced Budget Analytics**: Spending trends and forecasts

### Q2 2025

- [ ] **Streaming Payments**: Real-time salary accrual (Superfluid)
- [ ] **Multi-Token Support**: Pay in USDC, USDT, DAI
- [ ] **Mobile App**: React Native app for employees
- [ ] **Tax Withholding**: Automatic deductions with compliance

### Q3 2025

- [ ] **Multi-Chain**: Deploy to Polygon, Arbitrum, Base
- [ ] **Fiat Off-Ramp**: Direct bank transfers
- [ ] **Compliance Dashboard**: SOC 2, GDPR logs
- [ ] **White-Label Solution**: Custom branding for enterprises

---

## 📞 Feature Requests

Have ideas for new features? We'd love to hear from you!

- **GitHub Issues**: https://github.com/yourusername/mnee-payroll/issues
- **Discussions**: https://github.com/yourusername/mnee-payroll/discussions

---

## 🔄 Version History

| Version | Date | Features |
|---------|------|----------|
| 1.1.0 | Dec 2024 | Multi-company, Company customization, Budget management |
| 1.0.0 | Nov 2024 | Initial MVP release |

---

**Last Updated:** January 2025
