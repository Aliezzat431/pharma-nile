-- ============================================================
-- PHARMANILE DATABASE RESET SCRIPT
-- WARNING: THIS WILL DELETE ALL DATA IN THE DATABASE
-- ============================================================

-- 1. DROP TRIGGERS
DROP TRIGGER IF EXISTS trg_orders_monthly_summary ON orders;

-- 2. DROP FUNCTIONS / RPCS
DROP FUNCTION IF EXISTS upsert_monthly_summary(uuid, int, int);
DROP FUNCTION IF EXISTS trigger_refresh_monthly_summary();
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);
DROP FUNCTION IF EXISTS smart_search(uuid, text, int, int);
DROP FUNCTION IF EXISTS get_critical_alerts(uuid);
DROP FUNCTION IF EXISTS fast_checkout(uuid, uuid, jsonb, numeric, text, uuid);
DROP FUNCTION IF EXISTS get_financial_stats(uuid, int);
DROP FUNCTION IF EXISTS get_monthly_report(uuid, int, int);

-- 3. DROP TABLES & VIEWS (Ordered to avoid FK conflicts)
DROP VIEW IF EXISTS product_inventory CASCADE;
DROP TABLE IF EXISTS inventory_snapshots CASCADE;
DROP TABLE IF EXISTS monthly_summaries CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS product_inventory CASCADE; 
DROP TABLE IF EXISTS pharmacy_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS debt_payments CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;

-- 4. CLEANUP EXTENSIONS (Optional)
-- DROP EXTENSION IF EXISTS pg_trgm;

-- ============================================================
-- NOTE: AFTER RUNNING THIS, YOU MUST RUN:
-- 1. master_database_setup.sql (to recreate core tables)
-- 2. database_optimization.sql (to add analytics, indexes and RPCs)
-- ============================================================
