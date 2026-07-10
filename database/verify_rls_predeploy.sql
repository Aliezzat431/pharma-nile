-- ============================================================
-- PharmaNile: RLS Verification Script
-- Run in Supabase SQL Editor BEFORE every production deployment.
-- If any check returns FALSE, deployment MUST be halted.
-- ============================================================

-- ─── SECTION 1: Verify RLS is ENABLED on all sensitive tables ────────────────
DO $$
DECLARE
  v_table text;
  v_rls_enabled boolean;
  v_failed_tables text[] := '{}';
  v_required_tables text[] := ARRAY[
    'pharmacies', 'user_profiles', 'user_pharmacy_access',
    'products', 'orders', 'order_items', 'customers',
    'invoices', 'invoice_items', 'returns', 'stock_transfers',
    'financials', 'staff_members', 'shortages', 'sadqah',
    'monthly_summaries', 'pharmacy_settings', 'agent_action_logs',
    'preferences', 'batches'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_required_tables LOOP
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    IF v_rls_enabled IS NULL THEN
      RAISE WARNING '[RLS CHECK] Table "%" does not exist!', v_table;
      v_failed_tables := v_failed_tables || v_table;
    ELSIF NOT v_rls_enabled THEN
      RAISE WARNING '[RLS CHECK] RLS is DISABLED on table "%"!', v_table;
      v_failed_tables := v_failed_tables || v_table;
    END IF;
  END LOOP;

  IF array_length(v_failed_tables, 1) > 0 THEN
    RAISE EXCEPTION '[DEPLOYMENT BLOCKED] RLS is not enabled on: %', array_to_string(v_failed_tables, ', ');
  ELSE
    RAISE NOTICE '[RLS CHECK] ✅ All tables have RLS enabled';
  END IF;
END $$;


-- ─── SECTION 2: Verify all tables have at least one RLS policy ───────────────
DO $$
DECLARE
  v_table text;
  v_policy_count integer;
  v_tables_without_policies text[] := '{}';
  v_required_tables text[] := ARRAY[
    'pharmacies', 'products', 'orders', 'customers',
    'invoices', 'financials', 'stock_transfers'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_required_tables LOOP
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = v_table;

    IF v_policy_count = 0 THEN
      RAISE WARNING '[POLICY CHECK] Table "%" has NO RLS policies!', v_table;
      v_tables_without_policies := v_tables_without_policies || v_table;
    ELSE
      RAISE NOTICE '[POLICY CHECK] ✅ Table "%" has % polic(ies)', v_table, v_policy_count;
    END IF;
  END LOOP;

  IF array_length(v_tables_without_policies, 1) > 0 THEN
    RAISE EXCEPTION '[DEPLOYMENT BLOCKED] Tables with no RLS policies: %',
      array_to_string(v_tables_without_policies, ', ');
  END IF;
END $$;


-- ─── SECTION 3: Verify auth trigger exists ───────────────────────────────────
DO $$
DECLARE
  v_trigger_exists boolean;
  v_function_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_on_auth_user_created'
  ) INTO v_trigger_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user_registration'
      AND pronamespace = 'public'::regnamespace
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    RAISE EXCEPTION '[DEPLOYMENT BLOCKED] handle_new_user_registration() function is missing! Run fix_rls_triggers.sql';
  END IF;

  IF NOT v_trigger_exists THEN
    RAISE EXCEPTION '[DEPLOYMENT BLOCKED] trg_on_auth_user_created trigger is missing! Run fix_rls_triggers.sql';
  END IF;

  RAISE NOTICE '[TRIGGER CHECK] ✅ Auth trigger and function exist';
END $$;


-- ─── SECTION 4: Verify anon grants for login page ────────────────────────────
DO $$
DECLARE
  v_has_chains_grant boolean;
  v_has_pharmacies_grant boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_name = 'chains' AND privilege_type = 'SELECT'
  ) INTO v_has_chains_grant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_name = 'pharmacies' AND privilege_type = 'SELECT'
  ) INTO v_has_pharmacies_grant;

  IF NOT v_has_chains_grant THEN
    RAISE WARNING '[GRANT CHECK] anon role missing SELECT on chains — login page may break';
  ELSE
    RAISE NOTICE '[GRANT CHECK] ✅ anon has SELECT on chains';
  END IF;

  IF NOT v_has_pharmacies_grant THEN
    RAISE WARNING '[GRANT CHECK] anon role missing SELECT on pharmacies — login page may break';
  ELSE
    RAISE NOTICE '[GRANT CHECK] ✅ anon has SELECT on pharmacies';
  END IF;
END $$;


-- ─── SECTION 5: Verify critical indexes exist ────────────────────────────────
DO $$
DECLARE
  v_index text;
  v_index_exists boolean;
  v_missing_indexes text[] := '{}';
  v_required_indexes text[] := ARRAY[
    'idx_orders_pharmacy_created',
    'idx_order_items_order_id',
    'idx_products_pharmacy_name',
    'idx_batches_product_pharmacy_qty',
    'idx_batches_pharmacy_expiry',
    'idx_customers_pharmacy_phone'
  ];
BEGIN
  FOREACH v_index IN ARRAY v_required_indexes LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = v_index
    ) INTO v_index_exists;

    IF NOT v_index_exists THEN
      RAISE WARNING '[INDEX CHECK] Missing index: "%"', v_index;
      v_missing_indexes := v_missing_indexes || v_index;
    END IF;
  END LOOP;

  IF array_length(v_missing_indexes, 1) > 0 THEN
    RAISE WARNING '[INDEX CHECK] Missing indexes detected: %. Run database_optimization.sql',
      array_to_string(v_missing_indexes, ', ');
  ELSE
    RAISE NOTICE '[INDEX CHECK] ✅ All critical indexes exist';
  END IF;
END $$;


-- ─── SECTION 6: Verify helper functions exist ────────────────────────────────
DO $$
DECLARE
  v_func text;
  v_exists boolean;
  v_required_funcs text[] := ARRAY[
    'get_my_pharmacy_id',
    'get_my_chain_id',
    'upsert_monthly_summary',
    'fast_checkout',
    'get_dashboard_stats',
    'smart_search'
  ];
BEGIN
  FOREACH v_func IN ARRAY v_required_funcs LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = v_func AND pronamespace = 'public'::regnamespace
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE WARNING '[FUNCTION CHECK] Missing RPC function: "%"', v_func;
    ELSE
      RAISE NOTICE '[FUNCTION CHECK] ✅ Function "%" exists', v_func;
    END IF;
  END LOOP;
END $$;


-- ─── SECTION 7: Summary report ───────────────────────────────────────────────
SELECT
  'PharmaNile RLS Verification' AS report_name,
  NOW() AS run_at,
  current_database() AS database,
  (SELECT COUNT(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r') AS total_tables,
  (SELECT COUNT(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relrowsecurity = true) AS tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_rls_policies,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS total_indexes,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'trg_%') AS total_custom_triggers;
