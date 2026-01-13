-- ⚠️ RUN THIS ON PRODUCTION DATABASE FIRST BEFORE DEPLOYING ⚠️
--
-- This script removes the failed migration record from the _prisma_migrations table
-- so that new deployments won't be blocked by the P3009 error.
--
-- HOW TO RUN ON RENDER:
-- 1. Go to your Render Dashboard
-- 2. Click on your PostgreSQL database service
-- 3. Click "Connect" -> "External Connection"
-- 4. Copy the connection string
-- 5. Use a PostgreSQL client (pgAdmin, DBeaver, or psql) to connect
-- 6. Run this SQL script
--
-- OR use Render's web console (if available in your plan)

-- Check if the failed migration exists
SELECT * FROM "_prisma_migrations"
WHERE migration_name = '20260103095032_init';

-- Delete the failed migration record
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260103095032_init';

-- Verify it's deleted
SELECT * FROM "_prisma_migrations"
ORDER BY started_at DESC;

-- ✅ After running this, deploy normally on Render
-- The new migration 20260112_add_balance_and_budgets_features will apply cleanly
