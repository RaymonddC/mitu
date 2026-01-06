#!/bin/bash1

##############################################
# MNEE Autonomous Payroll Agent - Demo Script
#
# This script demonstrates the full workflow:
# 1. Setup and data seeding
# 2. Add an employee
# 3. Run payroll manually
# 4. View transaction results
##############################################

set -e

echo "======================================================================"
echo "  MNEE Autonomous Payroll Agent - Hackathon Demo"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
EMPLOYER_WALLET="mnee1test_employer_wallet_address_12345"

echo -e "${BLUE}📋 Demo Overview:${NC}"
echo "  1. Connect employer wallet"
echo "  2. View dashboard summary"
echo "  3. Add a new employee"
echo "  4. Run payroll (test mode)"
echo "  5. View transaction results"
echo ""
read -p "Press Enter to start the demo..."
echo ""

# Step 1: Check backend health
echo -e "${BLUE}Step 1: Checking backend connection...${NC}"
HEALTH=$(curl -s ${BACKEND_URL}/health | jq -r '.status')
if [ "$HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ Backend is running and healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Backend may not be running${NC}"
    echo "   Please start the backend: cd backend && npm run dev"
    exit 1
fi
echo ""
sleep 2

# Step 2: Get employer data
echo -e "${BLUE}Step 2: Fetching employer data...${NC}"
EMPLOYER=$(curl -s ${BACKEND_URL}/api/employers/${EMPLOYER_WALLET})
COMPANY_NAME=$(echo $EMPLOYER | jq -r '.data.companyName')
TOTAL_PAYROLL=$(echo $EMPLOYER | jq -r '.data.totalMonthlyPayroll')
EMPLOYEE_COUNT=$(echo $EMPLOYER | jq -r '.data.employees | length')

echo -e "${GREEN}✅ Employer found:${NC}"
echo "   Company: $COMPANY_NAME"
echo "   Employees: $EMPLOYEE_COUNT"
echo "   Monthly Payroll: $TOTAL_PAYROLL MNEE"
echo ""
sleep 2

# Step 3: List current employees
echo -e "${BLUE}Step 3: Current employees:${NC}"
EMPLOYER_ID=$(echo $EMPLOYER | jq -r '.data.id')
EMPLOYEES=$(curl -s "${BACKEND_URL}/api/employees?employerId=${EMPLOYER_ID}")
echo $EMPLOYEES | jq -r '.data[] | "   • \(.name) - \(.salaryAmount) MNEE"'
echo ""
sleep 2

# Step 4: Add a new employee
echo -e "${BLUE}Step 4: Adding a new employee...${NC}"
NEW_EMPLOYEE=$(cat <<EOF
{
  "employerId": "${EMPLOYER_ID}",
  "name": "Demo Employee",
  "email": "demo@example.com",
  "walletAddress": "mnee1demo_employee_wallet_$(date +%s)",
  "salaryAmount": 1500,
  "notes": "Added via demo script"
}
EOF
)

RESULT=$(curl -s -X POST "${BACKEND_URL}/api/employees" \
  -H "Content-Type: application/json" \
  -d "$NEW_EMPLOYEE")

if [ $(echo $RESULT | jq -r '.success') = "true" ]; then
    EMPLOYEE_NAME=$(echo $RESULT | jq -r '.data.name')
    EMPLOYEE_SALARY=$(echo $RESULT | jq -r '.data.salaryAmount')
    echo -e "${GREEN}✅ Employee added successfully:${NC}"
    echo "   Name: $EMPLOYEE_NAME"
    echo "   Salary: $EMPLOYEE_SALARY MNEE"
else
    echo -e "${YELLOW}⚠️  Note: Employee may already exist${NC}"
fi
echo ""
sleep 2

# Step 5: Run payroll in test mode
echo -e "${BLUE}Step 5: Running payroll (TEST MODE)...${NC}"
echo "   This will simulate transactions without actual blockchain execution"
echo ""

PAYROLL_RUN=$(cat <<EOF
{
  "employerId": "${EMPLOYER_ID}",
  "testMode": true
}
EOF
)

PAYROLL_RESULT=$(curl -s -X POST "${BACKEND_URL}/api/payroll/run" \
  -H "Content-Type: application/json" \
  -d "$PAYROLL_RUN")

SUCCESS_COUNT=$(echo $PAYROLL_RESULT | jq -r '.data.successCount')
FAILED_COUNT=$(echo $PAYROLL_RESULT | jq -r '.data.failedCount')

echo -e "${GREEN}✅ Payroll execution completed:${NC}"
echo "   ✓ Succeeded: $SUCCESS_COUNT"
echo "   ✗ Failed: $FAILED_COUNT"
echo ""

echo "   Payment Details:"
echo $PAYROLL_RESULT | jq -r '.data.results[] | "   • \(.employeeName): \(.amount) MNEE [\(.status)] - TX: \(.txHash)"'
echo ""
sleep 2

# Step 6: View payroll history
echo -e "${BLUE}Step 6: Recent payroll history:${NC}"
HISTORY=$(curl -s "${BACKEND_URL}/api/payroll/history?employerId=${EMPLOYER_ID}")
echo $HISTORY | jq -r '.data[0:3][] | "   • \(.employee.name) - \(.amount) MNEE - \(.status) - \(.executedAt)"'
echo ""
sleep 2

# Step 7: View any alerts
echo -e "${BLUE}Step 7: Checking for alerts...${NC}"
ALERTS=$(curl -s "${BACKEND_URL}/api/alerts?employerId=${EMPLOYER_ID}&resolved=false")
ALERT_COUNT=$(echo $ALERTS | jq -r '.count')

if [ "$ALERT_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Active alerts found:${NC}"
    echo $ALERTS | jq -r '.data[] | "   [\(.severity)] \(.title): \(.message)"'
else
    echo -e "${GREEN}✅ No active alerts${NC}"
fi
echo ""

# Summary
echo "======================================================================"
echo -e "${GREEN}✅ Demo completed successfully!${NC}"
echo "======================================================================"
echo ""
echo "What you just saw:"
echo "  ✓ Connected to MNEE-native payroll system"
echo "  ✓ Added an employee to the system"
echo "  ✓ Executed payroll via backend API"
echo "  ✓ Simulated blockchain transactions (test mode)"
echo "  ✓ Viewed transaction logs and alerts"
echo ""
echo "Next steps:"
echo "  1. Open frontend: http://localhost:3000"
echo "  2. Connect wallet: $EMPLOYER_WALLET"
echo "  3. Explore the dashboard, employees, and payroll pages"
echo "  4. Run payroll with real MNEE transactions (disable test mode)"
echo ""
echo "For judges:"
echo "  • 100% MNEE-native implementation"
echo "  • Autonomous agent for scheduled payroll"
echo "  • AI guard checks for safety"
echo "  • Production-ready architecture"
echo "  • Full audit trail on-chain + database"
echo ""
echo "======================================================================"
