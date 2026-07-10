-- ============================================================
-- PharmaNile: DB Compliance and RLS Check RPC Function
-- Run this on your Supabase instance to allow the deploy verification script to run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_security_compliance()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  is_compliant boolean,
  error_message text
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_table text;
  v_rls_enabled boolean;
  v_policies bigint;
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
    -- Check if table exists
    SELECT EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = v_table AND relnamespace = 'public'::regnamespace
    ) INTO v_rls_enabled;

    IF NOT v_rls_enabled THEN
      table_name := v_table;
      rls_enabled := false;
      policy_count := 0;
      is_compliant := false;
      error_message := 'CRITICAL: Table does not exist in public schema';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Check if table has RLS enabled
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = v_table AND relnamespace = 'public'::regnamespace;
    
    IF NOT v_rls_enabled THEN
      table_name := v_table;
      rls_enabled := false;
      policy_count := 0;
      is_compliant := false;
      error_message := 'CRITICAL: Row-Level Security is DISABLED!';
      RETURN NEXT;
    ELSE
      -- Count policies
      SELECT COUNT(*) INTO v_policies
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table;
      
      table_name := v_table;
      rls_enabled := true;
      policy_count := v_policies;
      
      -- We require at least one policy for compliance
      IF v_policies = 0 THEN
        is_compliant := false;
        error_message := 'WARNING: No RLS policies defined. Table is locked but inaccessible.';
      ELSE
        is_compliant := true;
        error_message := NULL;
      END IF;
      
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;
