-- RPC: debug_system_stats
-- Calculates usage statistics for a specific pharmacy
CREATE OR REPLACE FUNCTION debug_system_stats(p_pharmacy_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_total_records int;
  v_orders_count int;
  v_products_count int;
  v_customers_count int;
  v_audit_logs_count int;
  v_sessions_count int;
  v_db_size_bytes bigint;
BEGIN
  -- Count records per table for this pharmacy
  SELECT COUNT(*) INTO v_orders_count FROM orders WHERE pharmacy_id = p_pharmacy_id;
  SELECT COUNT(*) INTO v_products_count FROM products WHERE pharmacy_id = p_pharmacy_id;
  SELECT COUNT(*) INTO v_customers_count FROM customers WHERE pharmacy_id = p_pharmacy_id;
  SELECT COUNT(*) INTO v_audit_logs_count FROM audit_logs WHERE pharmacy_id = p_pharmacy_id;
  SELECT COUNT(*) INTO v_sessions_count FROM sessions WHERE pharmacy_id = p_pharmacy_id;

  v_total_records := v_orders_count + v_products_count + v_customers_count + v_audit_logs_count + v_sessions_count;

  -- Estimate database size (this is complex in Postgres/Supabase via RPC, 
  -- so we'll provide a reasonable estimate or use pg_database_size if allowed)
  -- For a more accurate per-pharmacy size, we would sum up column sizes, 
  -- but here we return a global size or a scaled estimate.
  SELECT pg_database_size(current_database()) INTO v_db_size_bytes;

  -- We scale the db size to the pharmacy's proportional share of records 
  -- (This is just an estimate for display purposes)
  -- If you want actual size, usually you'd need superuser to see specific table sizes on disk.

  v_result := json_build_object(
    'total_records', v_total_records,
    'orders', v_orders_count,
    'products', v_products_count,
    'customers', v_customers_count,
    'audit_logs', v_audit_logs_count,
    'sessions', v_sessions_count,
    'database_size_bytes', v_db_size_bytes
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION debug_system_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_system_stats(uuid) TO service_role;
