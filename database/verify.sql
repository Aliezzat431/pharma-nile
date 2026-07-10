-- ============================================================
-- PHARMANILE: PRE-DEPLOYMENT VERIFICATION SCRIPT
-- Run in Supabase SQL Editor BEFORE every production deployment.
-- All checks must pass (no EXCEPTION) before going live.
-- ============================================================


-- ─── CHECK 1: RLS enabled on all required tables ─────────────────────────────
DO $$
DECLARE
  v_table text;
  v_rls_enabled boolean;
  v_failed text[] := '{}';
  v_required text[] := ARRAY[
    'chains', 'pharmacies', 'user_profiles', 'user_pharmacy_access',
    'products', 'batches', 'orders', 'order_items', 'customers',
    'stock_transfers', 'financial_transactions', 'debt_payments',
    'audit_logs', 'sessions', 'pharmacy_settings',
    'monthly_summaries', 'inventory_snapshots', 'agent_action_logs'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_required LOOP
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    IF v_rls_enabled IS NULL THEN
      RAISE WARNING '[RLS] Table "%" does not exist!', v_table;
      v_failed := v_failed || v_table;
    ELSIF NOT v_rls_enabled THEN
      RAISE WARNING '[RLS] RLS is DISABLED on "%"', v_table;
      v_failed := v_failed || v_table;
    ELSE
      RAISE NOTICE '[RLS] ✅ "%"', v_table;
    END IF;
  END LOOP;

  IF array_length(v_failed, 1) > 0 THEN
    RAISE EXCEPTION '[BLOCKED] RLS missing on: %', array_to_string(v_failed, ', ');
  END IF;
END $$;


-- ─── CHECK 2: All key tables have at least one policy ────────────────────────
DO $$
DECLARE
  v_table text;
  v_count int;
  v_failed text[] := '{}';
  v_required text[] := ARRAY[
    'pharmacies', 'products', 'orders', 'customers',
    'stock_transfers', 'financial_transactions', 'agent_action_logs'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_required LOOP
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = v_table;

    IF v_count = 0 THEN
      RAISE WARNING '[POLICY] Table "%" has NO policies!', v_table;
      v_failed := v_failed || v_table;
    ELSE
      RAISE NOTICE '[POLICY] ✅ "%" — % polic(ies)', v_table, v_count;
    END IF;
  END LOOP;

  IF array_length(v_failed, 1) > 0 THEN
    RAISE EXCEPTION '[BLOCKED] No RLS policies on: %', array_to_string(v_failed, ', ');
  END IF;
END $$;


-- ─── CHECK 3: Auth trigger and registration function exist ───────────────────
DO $$
DECLARE
  v_trigger_ok  boolean;
  v_function_ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_ok;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user_registration'
      AND pronamespace = 'public'::regnamespace
  ) INTO v_function_ok;

  IF NOT v_function_ok THEN
    RAISE EXCEPTION '[BLOCKED] handle_new_user_registration() is missing — re-run schema.sql';
  END IF;
  IF NOT v_trigger_ok THEN
    RAISE EXCEPTION '[BLOCKED] on_auth_user_created trigger is missing — re-run schema.sql';
  END IF;

  RAISE NOTICE '[TRIGGER] ✅ Auth trigger and registration function exist';
END $$;


-- ─── CHECK 4: anon grants for login page (chains + pharmacies) ───────────────
DO $$
DECLARE
  v_chains_ok     boolean;
  v_pharmacies_ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_name = 'chains' AND privilege_type = 'SELECT'
  ) INTO v_chains_ok;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_name = 'pharmacies' AND privilege_type = 'SELECT'
  ) INTO v_pharmacies_ok;

  IF NOT v_chains_ok     THEN RAISE WARNING '[GRANT] anon missing SELECT on chains — login may break'; END IF;
  IF NOT v_pharmacies_ok THEN RAISE WARNING '[GRANT] anon missing SELECT on pharmacies — login may break'; END IF;

  IF v_chains_ok AND v_pharmacies_ok THEN
    RAISE NOTICE '[GRANT] ✅ anon SELECT on chains & pharmacies';
  END IF;
END $$;


-- ─── CHECK 5: Critical indexes exist ─────────────────────────────────────────
DO $$
DECLARE
  v_idx text;
  v_exists boolean;
  v_missing text[] := '{}';
  v_required text[] := ARRAY[
    'idx_orders_pharmacy_created',
    'idx_order_items_order_id',
    'idx_products_pharmacy_name',
    'idx_products_name_trgm',
    'idx_batches_product_pharmacy_qty',
    'idx_batches_pharmacy_expiry',
    'idx_monthly_summaries_pharmacy_year_month',
    'idx_stock_transfers_from',
    'idx_stock_transfers_to'
  ];
BEGIN
  FOREACH v_idx IN ARRAY v_required LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = v_idx
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE WARNING '[INDEX] Missing: "%"', v_idx;
      v_missing := v_missing || v_idx;
    ELSE
      RAISE NOTICE '[INDEX] ✅ "%"', v_idx;
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING '[INDEX] Missing indexes: % — re-run schema.sql', array_to_string(v_missing, ', ');
  END IF;
END $$;


-- ─── CHECK 6: Required RPC functions exist ────────────────────────────────────
DO $$
DECLARE
  v_func text;
  v_exists boolean;
  v_required text[] := ARRAY[
    'get_my_pharmacy_id',
    'verify_chain_password',
    'upsert_monthly_summary',
    'fast_checkout',
    'get_dashboard_stats',
    'smart_search',
    'get_critical_alerts',
    'get_financial_stats',
    'get_monthly_report',
    'bulk_import_inventory',
    'complete_stock_transfer'
  ];
BEGIN
  FOREACH v_func IN ARRAY v_required LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = v_func AND pronamespace = 'public'::regnamespace
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE WARNING '[FUNCTION] Missing: "%" — re-run schema.sql', v_func;
    ELSE
      RAISE NOTICE '[FUNCTION] ✅ "%"', v_func;
    END IF;
  END LOOP;
END $$;


-- ─── SUMMARY REPORT ──────────────────────────────────────────────────────────
SELECT
  'PharmaNile Verification Report'                                                   AS report,
  NOW()                                                                              AS run_at,
  (SELECT COUNT(*) FROM pg_class
   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r')                   AS total_tables,
  (SELECT COUNT(*) FROM pg_class
   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
     AND relrowsecurity = true)                                                      AS tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')                    AS total_policies,
  (SELECT COUNT(*) FROM pg_indexes  WHERE schemaname = 'public')                    AS total_indexes,
  (SELECT COUNT(*) FROM pg_proc     WHERE pronamespace = 'public'::regnamespace)    AS total_functions,
  (SELECT COUNT(*) FROM pg_trigger  WHERE tgname LIKE 'trg_%')                      AS total_triggers;
