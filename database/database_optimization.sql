-- ==============================================================================
-- PharmaNile Database Optimization & Automated Garbage Collection Script
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
-- Make sure the pg_cron extension is enabled for scheduling jobs.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. AUTOMATED GARBAGE COLLECTION (CRON JOBS)
-- Schedule cleanup of audit logs older than 60 days
-- Runs daily at 2:00 AM
SELECT cron.schedule(
  'cleanup_audit_logs_daily',
  '0 2 * * *',
  $$ DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '60 days'; $$
);

-- Schedule cleanup of closed/abandoned sessions older than 1 year
-- Runs on the 1st of every month at 3:00 AM
SELECT cron.schedule(
  'cleanup_old_sessions_monthly',
  '0 3 1 * *',
  $$ DELETE FROM sessions WHERE (status = 'closed' OR logout_time IS NOT NULL) AND created_at < NOW() - INTERVAL '1 year'; $$
);

-- Schedule cleanup of cancelled orders older than 30 days
-- Runs weekly on Sunday at 4:00 AM
SELECT cron.schedule(
  'cleanup_cancelled_orders_weekly',
  '0 4 * * 0',
  $$ DELETE FROM orders WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '30 days'; $$
);


-- 3. AUTOMATED MATERIALIZED VIEW REFRESH
-- Assuming monthly_sales_summary is a materialized view, we need to refresh it periodically so
-- dashboard queries remain fast over time without manual intervention.
-- Runs daily at 1:00 AM
-- Note: Replace 'monthly_sales_summary' with your actual materialized view name if different.
/*
SELECT cron.schedule(
  'refresh_monthly_sales_summary_daily',
  '0 1 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales_summary; $$
);
*/


-- 4. ADDITIONAL PERFORMANCE INDEXES
-- Creating compound and missing indexes to speed up common queries over time as data grows.

-- Index for POS Search: Barcode lookups
CREATE INDEX IF NOT EXISTS idx_batches_barcode 
ON batches (pharmacy_id, barcode);

-- Index for User filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_chain 
ON user_profiles (chain_id, pharmacy_id, role);

-- Index for Session lookups to quickly find active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active 
ON sessions (pharmacy_id, user_id) WHERE status = 'active';

-- Index on audit logs to speed up the cleanup cron job
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs (created_at);

-- Add comments for documentation
COMMENT ON EXTENSION pg_cron IS 'Used for automated garbage collection and materialized view refreshes';
