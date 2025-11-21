# Quick Start Guide - MNEE Autonomous Payroll

## ⚡ Get Running in 5 Minutes

### Prerequisites Check

```bash
node --version   # Should be 18+
npm --version    # Any recent version
docker --version # Optional but recommended
```

### Step 1: Install Dependencies

```bash
# From project root
npm install
```

This installs dependencies for all workspaces (backend, frontend, contracts, agents).

### Step 2: Setup Database

```bash
# Option A: Docker (Recommended)
docker run --name mnee-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16-alpine

# Option B: Local PostgreSQL
# Make sure PostgreSQL is running on port 5432
```

### Step 3: Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your values (use any text editor)
nano .env
```

**Minimum required for testing:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mnee_payroll"
MNEE_RPC_URL="https://testnet.mnee-rpc.io"
MNEE_CHAIN_ID="mnee-testnet-1"
```

### Step 4: Initialize Database

```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### Step 5: Start Application

```bash
# Start both backend and frontend
npm run dev
```

This runs:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

### Step 6: Open & Test

1. Open browser: http://localhost:3000
2. Click "Connect Wallet"
3. Test wallet: `mnee1test_employer_wallet_address_12345`
4. Explore dashboard!

---

## 🧪 Run Demo Script

```bash
# Make executable (first time only)
chmod +x demo.sh

# Run demo
./demo.sh
```

---

## 📚 Common Commands

### Development

```bash
# Start everything
npm run dev

# Start backend only
cd backend && npm run dev

# Start frontend only
cd frontend && npm run dev

# View database (Prisma Studio)
cd backend && npx prisma studio
```

### Database

```bash
# Create new migration
cd backend
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Reseed data
npm run seed
```

### Testing

```bash
# Run all tests
npm run test

# Backend tests only
cd backend && npm run test

# Contract tests only
cd contracts && npm run test
```

### Deployment

```bash
# Deploy contract
cd contracts && npm run deploy

# Deploy agent
cd agents && npm run deploy

# Build frontend for production
cd frontend && npm run build

# Build backend for production
cd backend && npm run build
```

### Docker

```bash
# Start all services with Docker Compose
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker restart mnee-db

# Or start new instance
docker run --name mnee-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine
```

### Issue: "Port 3000/3001 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
# PORT=3002
```

### Issue: "Prisma Client not generated"

**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Also clear npm cache
npm cache clean --force
```

### Issue: "Frontend shows 'Failed to load data'"

**Solution:**
1. Check backend is running: http://localhost:3001/health
2. Verify DATABASE_URL in .env
3. Check browser console for CORS errors
4. Ensure backend started successfully (check terminal)

---

## 📦 Project Structure Quick Reference

```
.
├── backend/           → Express API + Prisma
│   ├── src/
│   │   ├── controllers/  → Business logic
│   │   ├── routes/       → API endpoints
│   │   ├── services/     → MNEE integration
│   │   └── server.ts     → Entry point
│   └── prisma/
│       └── schema.prisma → Database models
├── frontend/          → Next.js app
│   ├── app/
│   │   ├── dashboard/    → Dashboard page
│   │   ├── employees/    → Employee CRUD
│   │   ├── payroll/      → Payroll execution
│   │   └── settings/     → Settings page
│   └── lib/
│       ├── api.ts        → Backend client
│       └── store.ts      → Global state
├── contracts/         → MNEE Flow Contracts
│   └── salary_flow.mnee.ts  → Main contract
├── agents/            → Autonomous agents
│   └── salary_agent.ts      → Payroll agent
├── .env               → Environment config (YOU CREATE THIS)
├── .env.example       → Template
├── demo.sh            → Hackathon demo
└── README.md          → Full documentation
```

---

## 🔑 Test Credentials

These are seeded by `npm run db:seed`:

**Employer:**
- Wallet: `mnee1test_employer_wallet_address_12345`
- Company: Acme Corp
- Payroll Day: 28

**Employees:**
- Alice Johnson - 3000 MNEE/month
- Bob Smith - 2500 MNEE/month
- Carol White - 2000 MNEE/month

---

## 📞 Need Help?

1. Check [README.md](README.md) for detailed docs
2. Check [PITCH.md](PITCH.md) for demo script
3. Open an issue on GitHub
4. Check MNEE documentation

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend health check returns "healthy": http://localhost:3001/health
- [ ] Frontend loads without errors: http://localhost:3000
- [ ] Can connect wallet (test wallet)
- [ ] Dashboard shows employer data
- [ ] Can view employees list
- [ ] Can add new employee
- [ ] Can run payroll (test mode)
- [ ] Can view payroll history
- [ ] Database has data (check Prisma Studio)
- [ ] No errors in browser console
- [ ] No errors in backend terminal

---

## 🚀 Next Steps

Once everything is working:

1. **Customize**: Update company name, add real employees
2. **Deploy Contracts**: Run `cd contracts && npm run deploy`
3. **Deploy Agent**: Run `cd agents && npm run deploy`
4. **Test Payroll**: Use "Run Payroll Now" button
5. **Review Logs**: Check transaction history
6. **Deploy to Production**: Follow README deployment guide

---

**You're all set!** 🎉

For the full experience, read [README.md](README.md) and run [demo.sh](./demo.sh).
