-- ============================================================
-- PHARMANILE DATABASE RESET SCRIPT
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA
-- Run this, then run schema.sql to rebuild from scratch.
-- ============================================================

-- 1. DROP TRIGGERS
DROP TRIGGER IF EXISTS trg_orders_monthly_summary    ON orders    CASCADE;
DROP TRIGGER IF EXISTS trg_stock_transfer_updated_at ON stock_transfers CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created          ON auth.users CASCADE;

-- 2. DROP FUNCTIONS / RPCs
DROP FUNCTION IF EXISTS handle_new_user_registration() CASCADE;
DROP FUNCTION IF EXISTS upsert_monthly_summary(uuid, int, int) CASCADE;
DROP FUNCTION IF EXISTS trigger_refresh_monthly_summary() CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS smart_search(uuid, text, int, int) CASCADE;
DROP FUNCTION IF EXISTS get_critical_alerts(uuid) CASCADE;
DROP FUNCTION IF EXISTS fast_checkout(uuid, uuid, jsonb, numeric, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_financial_stats(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS get_monthly_report(uuid, int, int) CASCADE;
DROP FUNCTION IF EXISTS debug_system_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS bulk_import_inventory(uuid, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS complete_stock_transfer(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS update_stock_transfer_timestamp() CASCADE;
DROP FUNCTION IF EXISTS get_my_pharmacy_id() CASCADE;
DROP FUNCTION IF EXISTS verify_chain_password(uuid, text) CASCADE;

-- 3. DROP VIEWS
DROP VIEW IF EXISTS product_inventory CASCADE;

-- 4. DROP TABLES (dependency order — children first)
DROP TABLE IF EXISTS agent_action_logs   CASCADE;
DROP TABLE IF EXISTS inventory_snapshots CASCADE;
DROP TABLE IF EXISTS monthly_summaries   CASCADE;
DROP TABLE IF EXISTS order_items         CASCADE;
DROP TABLE IF EXISTS orders              CASCADE;
DROP TABLE IF EXISTS stock_transfers     CASCADE;
DROP TABLE IF EXISTS batches             CASCADE;
DROP TABLE IF EXISTS products            CASCADE;
DROP TABLE IF EXISTS debt_payments       CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS audit_logs          CASCADE;
DROP TABLE IF EXISTS sessions            CASCADE;
DROP TABLE IF EXISTS pharmacy_settings   CASCADE;
DROP TABLE IF EXISTS customers           CASCADE;
DROP TABLE IF EXISTS user_pharmacy_access CASCADE;
DROP TABLE IF EXISTS user_profiles       CASCADE;
DROP TABLE IF EXISTS pharmacies          CASCADE;
DROP TABLE IF EXISTS chains              CASCADE;

-- ✅ Done. Now run: schema.sql → seeds.sql (optional)