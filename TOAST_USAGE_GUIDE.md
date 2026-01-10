# 🎨 Web3 Toast System - Usage Guide

## Overview

Your project now has a beautiful, modern Web3-style toast notification system with:
- ✨ 5 variants (success, error, warning, info, loading)
- 🎭 Smooth animations and transitions
- 🎯 Progress bars
- 🔗 Etherscan links for transactions
- 🖱️ Dismissible with close button
- 📱 Mobile-responsive
- 🛡️ XSS-safe (HTML escaped)
- 🎨 Glass morphism design
- 🌈 Gradient backgrounds

---

## 🚀 Basic Usage

### Method 1: Simple Object
```typescript
import { toast } from '@/components/ui/toaster'

toast({
  title: 'Success!',
  description: 'Your transaction was completed',
  variant: 'success',
  duration: 4000
})
```

### Method 2: Convenience Methods
```typescript
// Success
toast.success('Employee Added', 'John Doe has been added successfully')

// Error
toast.error('Failed to Save', 'Please try again')

// Warning
toast.warning('Low Balance', 'Only 100 MNEE remaining')

// Info
toast.info('New Feature', 'Check out batch transfers!')

// Loading (stays until dismissed)
const dismiss = toast.loading('Processing', 'Please wait...')
// Later: dismiss()
```

---

## 🎨 Toast Variants

### Success (Green)
```typescript
toast.success('Payment Confirmed!', 'Paid 5 employees successfully')
```
**When to use:** Successful operations, confirmations, completions

### Error (Red)
```typescript
toast.error('Transaction Failed', 'Insufficient funds in wallet')
```
**When to use:** Errors, failures, rejections

### Warning (Amber/Orange)
```typescript
toast.warning('Review Required', '2 employees need wallet verification')
```
**When to use:** Warnings, important notices, risks

### Info (Blue)
```typescript
toast.info('System Update', 'New features available')
```
**When to use:** Information, updates, general messages

### Loading (Purple)
```typescript
const dismiss = toast.loading('Confirming Transaction', 'Waiting for blockchain...')
// When done:
dismiss()
toast.success('Transaction Confirmed!')
```
**When to use:** Long operations, blockchain confirmations, async tasks

---

## 🔗 Web3 Features

### Transaction Hash Links
```typescript
toast({
  title: 'Transaction Sent',
  description: 'View on Etherscan',
  variant: 'success',
  txHash: '0x1234567890abcdef...' // Automatically creates Etherscan link
})
```

### Promise Wrapper
```typescript
await toast.promise(
  sendTransaction(),
  {
    loading: 'Sending transaction...',
    success: 'Transaction confirmed!',
    error: 'Transaction failed'
  }
)
```

---

## ⚙️ Advanced Options

### Custom Duration
```typescript
toast.success('Quick Message', undefined, 2000) // 2 seconds

toast.error('Important Error', 'Read this carefully', 10000) // 10 seconds
```

### No Auto-Dismiss (Loading)
```typescript
const dismiss = toast.loading('Syncing...', 'This may take a while')

// Manually dismiss later
setTimeout(() => {
  dismiss()
  toast.success('Sync Complete!')
}, 5000)
```

---

## 📝 Migration Guide

### Old Code
```typescript
// Before
toast({ title: 'Error', description: 'Failed to save' })
// ❌ No visual distinction, no variant
```

### New Code
```typescript
// After
toast.error('Failed to Save', 'Please check your connection')
// ✅ Red color, error icon, better UX
```

### Update Pattern
Replace all `toast()` calls with the appropriate variant:

```typescript
// ❌ Old
toast({ title: 'Success', description: 'Employee added' })
toast({ title: 'Error', description: 'Failed to load' })
toast({ title: 'Warning', description: 'Low balance' })

// ✅ New
toast.success('Employee Added', 'John Doe was added successfully')
toast.error('Failed to Load', 'Could not fetch employee data')
toast.warning('Low Balance', 'Only 100 MNEE remaining')
```

---

## 🎯 Real-World Examples

### Payroll Confirmation
```typescript
// When transaction is submitted
const dismiss = toast.loading(
  'Confirming Transaction',
  'Waiting for blockchain confirmation...'
)

// Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ ... })

// Dismiss loading
dismiss()

// Show result
if (receipt.status === 'success') {
  toast({
    variant: 'success',
    title: 'Payment Confirmed!',
    description: `Paid ${recipientCount} employee(s) successfully`,
    txHash: receipt.transactionHash
  })
} else {
  toast.error('Transaction Failed', 'Please contact support')
}
```

### Employee Management
```typescript
try {
  await employeeAPI.create(data)
  toast.success('Employee Added', `${data.name} has been added to payroll`)
} catch (error: any) {
  toast.error('Failed to Add Employee', error.message)
}
```

### Risk Screening
```typescript
const results = await riskAPI.screen(employees)

if (results.blocked > 0) {
  toast.warning(
    'High Risk Detected',
    `${results.blocked} employee(s) flagged. Review required.`
  )
} else {
  toast.success('All Clear', `${results.safe} employees passed screening`)
}
```

### Balance Check
```typescript
const balance = await getBalance()

if (balance < totalPayroll) {
  toast.error(
    'Insufficient Funds',
    `Need ${totalPayroll} MNEE, have ${balance} MNEE`
  )
}
```

---

## 🎨 Design System

### Colors
- **Success:** Green gradient (`from-green-900 to-emerald-900`)
- **Error:** Red gradient (`from-red-900 to-rose-900`)
- **Warning:** Amber gradient (`from-amber-900 to-orange-900`)
- **Info:** Blue gradient (`from-blue-900 to-indigo-900`)
- **Loading:** Purple gradient (`from-purple-900 to-violet-900`)

### Animations
- **Entry:** Slide in from right with fade
- **Exit:** Slide out to right with fade
- **Hover:** Scale up slightly
- **Progress:** Animated gradient bar

### Layout
- **Position:** Top-right corner
- **Max Width:** 28rem (448px)
- **Min Width:** 20rem (320px)
- **Spacing:** 0.5rem gap between toasts
- **Z-Index:** 100 (above most content)

---

## 🛡️ Security

### XSS Protection
All text content is automatically escaped:
```typescript
// ✅ Safe - automatically escaped
toast.success(userInput, 'User provided text is safe')

// The escapeHtml() function prevents XSS attacks
```

### Best Practices
- Never use `dangerouslySetInnerHTML` with toast content
- All user input is automatically sanitized
- Icons are predefined SVG strings
- Etherscan links are validated

---

## 🎭 Accessibility

- **Keyboard:** Close button is focusable
- **Screen Readers:** Semantic HTML structure
- **Focus States:** Clear outline on focus
- **Color Contrast:** WCAG AA compliant
- **Animation:** Respects `prefers-reduced-motion`

---

## 📱 Mobile Responsive

- Automatically adjusts width on small screens
- Touch-friendly close button
- Proper spacing and padding
- Readable font sizes

---

## 🔧 Troubleshooting

### Toast Not Appearing
```typescript
// Check that Toaster component is in your layout
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster /> {/* ✅ Must be present */}
      </body>
    </html>
  )
}
```

### Progress Bar Not Animating
```css
/* Check that globals.css includes the animation */
@keyframes progress {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

### TypeScript Errors
```typescript
// Ensure proper typing
import { toast } from '@/components/ui/toaster'

// Use the convenience methods for better type safety
toast.success('Title', 'Description') // ✅
toast({ variant: 'success', title: 'Title' }) // ✅
```

---

## 🚀 Performance

- **Lightweight:** No external dependencies
- **Fast:** CSS animations (GPU-accelerated)
- **Memory:** Auto-cleanup on dismiss
- **Stacking:** Efficient DOM management
- **Network:** Zero external requests

---

## ✨ Future Enhancements

Potential additions:
- Sound effects for different variants
- Undo actions
- Custom icons
- Position control (top-left, bottom-right, etc.)
- Stack limit (max toasts)
- Persistent toasts (saved to localStorage)

---

## 📖 Complete API Reference

```typescript
interface ToastOptions {
  title: string           // Required: Main message
  description?: string    // Optional: Additional details
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  duration?: number       // Milliseconds (0 = no auto-dismiss)
  txHash?: string         // Ethereum transaction hash
}

// Main function
toast(options: ToastOptions | string): () => void

// Convenience methods
toast.success(title, description?, duration?)
toast.error(title, description?, duration?)
toast.warning(title, description?, duration?)
toast.info(title, description?, duration?)
toast.loading(title, description?) // Returns dismiss function

// Promise wrapper
toast.promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: any) => string)
  }
): Promise<T>
```

---

## 🎉 Examples in Your Codebase

Update these files to use the new toast system:

### `app/employees/page.tsx`
```typescript
// Line 48: ❌ Old
toast({ title: 'Error', description: 'Failed to load employees' })
// ✅ New
toast.error('Failed to Load Employees', 'Please refresh the page')

// Line 87: ❌ Old
toast({ title: 'Success', description: 'Employee updated successfully' })
// ✅ New
toast.success('Employee Updated', `${formData.name} was updated successfully`)
```

### `app/payroll/page.tsx`
```typescript
// Line 79: ❌ Old
toast({ title: '🚨 Blocked Wallets', description: `${summary.blocked} employee(s) blocked` })
// ✅ New
toast.warning('Blocked Wallets', `${summary.blocked} employee(s) blocked. Review required.`)
```

### `components/WalletApproval.tsx`
```typescript
// Line 326: ❌ Old (using alert)
alert(`✅ Payment confirmed!`)
// ✅ New
toast({
  variant: 'success',
  title: 'Payment Confirmed!',
  description: `Paid ${recipientCount} employee(s) successfully`,
  txHash: txHash
})
```

---

Enjoy your new Web3-style toast system! 🎉
