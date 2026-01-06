# MNEE Autonomous Payroll - Documentation

**Last Updated**: December 10, 2025
**System Status**: Production-Ready Non-Custodial Payroll System

---

## 🚀 Quick Start

**New to the project?** Start here:
1. Read [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) - Complete system overview
2. Read [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md) - How the system works
3. Follow [project_setup.md](project_setup.md) - Get it running locally
4. Check [API_REFERENCE.md](API_REFERENCE.md) - API documentation

**Deploying to production?**
- See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) (coming soon)

**Something broken?**
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (coming soon)

---

## 📚 Documentation Index

### Core Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md)** | Complete system overview (Dec 2025) | Everyone |
| **[NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md)** | Non-custodial architecture deep dive | Developers |
| **[API_REFERENCE.md](API_REFERENCE.md)** | Complete API documentation | Developers |
| **[architecture.md](architecture.md)** | Technical architecture details | Developers |
| **[project_setup.md](project_setup.md)** | Development environment setup | Developers |

### Feature Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md)** | Duplicate payment prevention system | Developers |
| **[IDEMPOTENCY_KEY_EXPLAINED.md](IDEMPOTENCY_KEY_EXPLAINED.md)** | Understanding idempotency keys | Everyone |
| **[BATCH_APPROVAL_IMPLEMENTATION.md](BATCH_APPROVAL_IMPLEMENTATION.md)** | Batch transfer approval system | Developers |
| **[BATCH_CONTRACT_V2_UPGRADE.md](BATCH_CONTRACT_V2_UPGRADE.md)** | Batch contract V2 upgrade guide | Developers |
| **[METAMASK_FIX_SUMMARY.md](METAMASK_FIX_SUMMARY.md)** | MetaMask display improvements | Developers |

### Technical Reference

| Document | Description | Audience |
|----------|-------------|----------|
| **[ETHEREUM_MIGRATION.md](ETHEREUM_MIGRATION.md)** | Ethereum integration details | Developers |
| **[SMART_CONTRACT_RESEARCH.md](SMART_CONTRACT_RESEARCH.md)** | Smart contract research notes | Developers |
| **[ui_ux_spec.md](ui_ux_spec.md)** | UI/UX specifications | Designers |

### Deployment & Operations

| Document | Description | Audience |
|----------|-------------|----------|
| **[DEPLOY_TEST_MNEE.md](DEPLOY_TEST_MNEE.md)** | Test MNEE deployment | DevOps |
| **[mvp_features_list.md](mvp_features_list.md)** | MVP feature checklist | Product |

---

## 🎯 Documentation by Use Case

### "I'm a new developer joining the project"
1. [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) - Understand what you're building
2. [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md) - Understand how it works
3. [project_setup.md](project_setup.md) - Get your dev environment running
4. [API_REFERENCE.md](API_REFERENCE.md) - Learn the API endpoints
5. [IDEMPOTENCY_KEY_EXPLAINED.md](IDEMPOTENCY_KEY_EXPLAINED.md) - Understand core concepts

### "I need to add a new feature"
1. [architecture.md](architecture.md) - Understand the architecture
2. [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md) - See how features work together
3. [API_REFERENCE.md](API_REFERENCE.md) - Check existing endpoints
4. [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md) - Learn safety patterns

### "I'm deploying to production"
1. [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Deployment checklist (coming soon)
2. [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md) - Understand production architecture
3. [ETHEREUM_MIGRATION.md](ETHEREUM_MIGRATION.md) - Ethereum configuration

### "Something is broken"
1. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues (coming soon)
2. [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md) - Payment issues
3. [API_REFERENCE.md](API_REFERENCE.md) - Error codes

### "I'm integrating with the batch contract"
1. [BATCH_CONTRACT_V2_UPGRADE.md](BATCH_CONTRACT_V2_UPGRADE.md) - V2 contract details
2. [BATCH_APPROVAL_IMPLEMENTATION.md](BATCH_APPROVAL_IMPLEMENTATION.md) - Implementation guide
3. [METAMASK_FIX_SUMMARY.md](METAMASK_FIX_SUMMARY.md) - MetaMask display fix

---

## 🏗️ System Architecture Overview

### High-Level Flow
```
User → MetaMask → Frontend (Next.js)
                       ↓
                  Backend (Express)
                       ↓
                  PostgreSQL + Ethereum Network
```

### Key Components
- **Frontend**: Next.js + RainbowKit + wagmi/viem
- **Backend**: Express + Prisma + ethereumService
- **Blockchain**: Ethereum Sepolia (testnet) / Mainnet (production)
- **Smart Contracts**: ERC-20 MNEE Token + Batch Transfer Contract

### Architecture Highlights
- ✅ **100% Non-Custodial** - Employers keep full control of funds
- ✅ **Duplicate Prevention** - Idempotency key system prevents double payments
- ✅ **Batch Transfers** - Single transaction for multiple employees
- ✅ **Pre-Transaction Validation** - Checks before blockchain execution
- ✅ **Multi-Tenant** - Multiple employers on single platform

---

## 📖 Key Concepts

### Idempotency Key
A unique fingerprint (SHA256 hash) that prevents paying the same employee twice on the same day.
**Learn more**: [IDEMPOTENCY_KEY_EXPLAINED.md](IDEMPOTENCY_KEY_EXPLAINED.md)

### Non-Custodial
Employers keep MNEE tokens in their own wallets. Platform never holds funds or private keys.
**Learn more**: [NON_CUSTODIAL_ONLY.md](NON_CUSTODIAL_ONLY.md)

### Batch Transfer
Send payments to multiple employees in a single blockchain transaction.
**Learn more**: [BATCH_CONTRACT_V2_UPGRADE.md](BATCH_CONTRACT_V2_UPGRADE.md)

### Duplicate Payment Prevention
Three-layer system to prevent accidental double payments:
1. Backend check before approval creation
2. Frontend validation before MetaMask
3. Always record transactions (even duplicates)
**Learn more**: [DUPLICATE_PAYMENT_PREVENTION.md](DUPLICATE_PAYMENT_PREVENTION.md)

---

## 🔧 Development Workflow

### 1. Setup
```bash
npm install
docker run --name mnee-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine
cd backend && npx prisma migrate dev && npm run db:seed
```

### 2. Development
```bash
npm run dev  # Runs both backend and frontend
```

### 3. Testing
```bash
npm test
./demo.sh  # Run demo script
```

### 4. Building
```bash
npm run build
```

---

## 🗂️ Repository Structure

```
/
├── backend/           # Express API + Prisma
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Error handling, logging
│   └── prisma/
│       └── schema.prisma  # Database schema
│
├── frontend/          # Next.js app
│   ├── app/           # Pages (App Router)
│   ├── components/    # React components
│   └── lib/           # Utilities, API client
│
├── contracts/         # Smart contracts
│   └── src/           # Solidity contracts
│
├── docs/              # You are here!
│   ├── README.md      # This file
│   ├── CURRENT_ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   └── archive/       # Historical docs
│
└── CLAUDE.md          # Project instructions for Claude Code
```

---

## 📝 Documentation Standards

### When to Create New Docs
- New major feature added
- Architecture change
- New API endpoints
- New deployment requirement

### When to Update Existing Docs
- Feature behavior changes
- API endpoints modified
- Configuration changes
- Bug fixes affecting documented behavior

### Doc Format
- Use clear headers (##, ###)
- Include code examples
- Add diagrams where helpful
- Keep language simple and direct
- Date major updates at the top

---

## 📚 Historical Documentation

Older milestone docs are archived for reference:
- [archive/HANDOFF.md](archive/HANDOFF.md) - Nov 2025 handoff doc
- [archive/PHASE_2_3_COMPLETE.md](archive/PHASE_2_3_COMPLETE.md) - Phase 2-3 completion
- [archive/PHASE_4_COMPLETE.md](archive/PHASE_4_COMPLETE.md) - Phase 4 completion
- [archive/WEEK_2_COMPLETE.md](archive/WEEK_2_COMPLETE.md) - Week 2 milestone
- [archive/MIGRATION_STATUS.md](archive/MIGRATION_STATUS.md) - Migration tracking
- [archive/DEVELOPMENT_ROADMAP.md](archive/DEVELOPMENT_ROADMAP.md) - Original roadmap

---

## 🤝 Contributing to Documentation

### Found an Issue?
1. Check if the doc is outdated
2. Update the content
3. Update the "Last Updated" date at the top
4. Commit with message: `docs: update [filename] - [what changed]`

### Adding New Documentation?
1. Follow the format of existing docs
2. Add entry to this README.md
3. Link from related docs
4. Commit with message: `docs: add [filename] - [purpose]`

---

## 🔗 External Resources

- **MNEE Network**: https://mnee.net/
- **MNEE SDK Docs**: https://docs.mnee.net/
- **Ethereum Docs**: https://ethereum.org/en/developers/docs/
- **Sepolia Testnet**: https://sepolia.etherscan.io/
- **RainbowKit**: https://www.rainbowkit.com/
- **Wagmi**: https://wagmi.sh/
- **Viem**: https://viem.sh/

---

## 📧 Need Help?

1. **Check docs first**: Use the table of contents above
2. **Check troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (coming soon)
3. **Check API reference**: [API_REFERENCE.md](API_REFERENCE.md)
4. **Ask in team chat**: Provide context and what you've tried

---

**Last Updated**: December 10, 2025
**Maintained by**: Development Team
