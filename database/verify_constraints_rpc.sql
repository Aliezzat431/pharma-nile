-- ============================================================
-- PharmaNile: Database Constraints Check RPC Function
-- Run this on your Supabase instance to verify structural constraints.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_database_constraints()
RETURNS TABLE (
  constraint_name text,
  table_name text,
  constraint_type text,
  definition text,
  status text
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    con.conname::text AS constraint_name,
    rel.relname::text AS table_name,
    CASE con.contype
      WHEN 'p' THEN 'PRIMARY KEY'::text
      WHEN 'f' THEN 'FOREIGN KEY'::text
      WHEN 'c' THEN 'CHECK'::text
      WHEN 'u' THEN 'UNIQUE'::text
      ELSE 'OTHER'::text
    END AS constraint_type,
    pg_get_constraintdef(con.oid) AS definition,
    'OK'::text AS status
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = con.connamespace
  WHERE nsp.nspname = 'public'
  ORDER BY table_name, constraint_type;
END;
$$;
