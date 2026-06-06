-- ============================================================
--  PharmaNile Database Optimization Migration
--  Run this ONCE in your Supabase SQL Editor
--  Features:
--    1. Monthly summaries table (pre-aggregated, ultra-fast analytics)
--    2. Performance indexes on all hot-path columns
--    3. RPC: fast_checkout  — entire checkout in ONE DB call
--    4. RPC: get_dashboard_stats — replaces 5 JS round-trips
--    5. RPC: get_monthly_report  — instant monthly analytics
--    6. Auto-trigger to maintain monthly_summaries on order changes
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. MONTHLY SUMMARIES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id     uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  year            int  NOT NULL,
  month           int  NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_revenue   numeric(14,2) NOT NULL DEFAULT 0,
  total_cost      numeric(14,2) NOT NULL DEFAULT 0,
  total_profit    numeric(14,2) NOT NULL DEFAULT 0,
  total_orders    int           NOT NULL DEFAULT 0,
  cash_revenue    numeric(14,2) NOT NULL DEFAULT 0,
  debt_revenue    numeric(14,2) NOT NULL DEFAULT 0,
  sadqah_revenue  numeric(14,2) NOT NULL DEFAULT 0,
  returns_total   numeric(14,2) NOT NULL DEFAULT 0,
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, year, month)
);

-- Enable RLS on the new table
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_monthly_summaries_policy"
  ON monthly_summaries FOR ALL
  USING (pharmacy_id = (auth.jwt()->'user_metadata'->>'pharmacy_id')::uuid);

-- ─────────────────────────────────────────────
-- 2. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────

-- orders: most queries filter by pharmacy_id + created_at or status
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_created
  ON orders (pharmacy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_status
  ON orders (pharmacy_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_payment
  ON orders (pharmacy_id, payment_method);

-- order_items: joins always go through order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_pharmacy_product
  ON order_items (pharmacy_id, product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_batch_id
  ON order_items (batch_id);

-- batches: stock lookups by product + pharmacy + expiry (FEFO)
CREATE INDEX IF NOT EXISTS idx_batches_product_pharmacy_qty
  ON batches (product_id, pharmacy_id, quantity DESC);

CREATE INDEX IF NOT EXISTS idx_batches_pharmacy_expiry
  ON batches (pharmacy_id, expiry_date ASC)
  WHERE quantity > 0;

CREATE INDEX IF NOT EXISTS idx_batches_barcode
  ON batches (barcode, pharmacy_id);

-- products: name search (ilike uses trigram if pg_trgm enabled, else B-tree prefix)
CREATE INDEX IF NOT EXISTS idx_products_pharmacy_name
  ON products (pharmacy_id, name);

-- audit_logs: fetch latest logs per pharmacy
CREATE INDEX IF NOT EXISTS idx_audit_logs_pharmacy_created
  ON audit_logs (pharmacy_id, created_at DESC);

-- financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_pharmacy_created
  ON financial_transactions (pharmacy_id, created_at DESC);

-- debt_payments
CREATE INDEX IF NOT EXISTS idx_debt_payments_debtor
  ON debt_payments (debtor_id, payment_date DESC);

-- sessions: active session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_pharmacy_status
  ON sessions (pharmacy_id, status);

-- monthly_summaries
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_pharmacy_year_month
  ON monthly_summaries (pharmacy_id, year DESC, month DESC);

-- ─────────────────────────────────────────────
-- 3. FUNCTION: upsert_monthly_summary
--    Called by trigger on orders INSERT/UPDATE
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION upsert_monthly_summary(
  p_pharmacy_id uuid,
  p_year        int,
  p_month       int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO monthly_summaries (
    pharmacy_id, year, month,
    total_revenue, total_cost, total_profit,
    total_orders,
    cash_revenue, debt_revenue, sadqah_revenue,
    returns_total,
    updated_at
  )
  SELECT
    p_pharmacy_id,
    p_year,
    p_month,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total       ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' THEN cost_total  ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' THEN profit_total ELSE 0 END), 0),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash'   THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'debt'   THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'sadqah' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'returned'  THEN total ELSE 0 END), 0),
    now()
  FROM orders
  WHERE pharmacy_id = p_pharmacy_id
    AND EXTRACT(YEAR  FROM created_at) = p_year
    AND EXTRACT(MONTH FROM created_at) = p_month
  ON CONFLICT (pharmacy_id, year, month) DO UPDATE SET
    total_revenue  = EXCLUDED.total_revenue,
    total_cost     = EXCLUDED.total_cost,
    total_profit   = EXCLUDED.total_profit,
    total_orders   = EXCLUDED.total_orders,
    cash_revenue   = EXCLUDED.cash_revenue,
    debt_revenue   = EXCLUDED.debt_revenue,
    sadqah_revenue = EXCLUDED.sadqah_revenue,
    returns_total  = EXCLUDED.returns_total,
    updated_at     = now();
END;
$$;

-- ─────────────────────────────────────────────
-- 4. TRIGGER: auto-refresh monthly summary
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_refresh_monthly_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle the affected row(s)
  PERFORM upsert_monthly_summary(
    NEW.pharmacy_id,
    EXTRACT(YEAR  FROM NEW.created_at)::int,
    EXTRACT(MONTH FROM NEW.created_at)::int
  );

  -- If an UPDATE changed the month (edge case), refresh old month too
  IF TG_OP = 'UPDATE' AND
     (EXTRACT(MONTH FROM OLD.created_at) <> EXTRACT(MONTH FROM NEW.created_at) OR
      EXTRACT(YEAR  FROM OLD.created_at) <> EXTRACT(YEAR  FROM NEW.created_at)) THEN
    PERFORM upsert_monthly_summary(
      OLD.pharmacy_id,
      EXTRACT(YEAR  FROM OLD.created_at)::int,
      EXTRACT(MONTH FROM OLD.created_at)::int
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_monthly_summary ON orders;
CREATE TRIGGER trg_orders_monthly_summary
  AFTER INSERT OR UPDATE OF status, total, cost_total, profit_total, payment_method
  ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_monthly_summary();

-- ─────────────────────────────────────────────
-- 5. BACKFILL existing orders into monthly_summaries
-- ─────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT
      pharmacy_id,
      EXTRACT(YEAR  FROM created_at)::int AS yr,
      EXTRACT(MONTH FROM created_at)::int AS mo
    FROM orders
  LOOP
    PERFORM upsert_monthly_summary(r.pharmacy_id, r.yr, r.mo);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────
-- 6. RPC: get_dashboard_stats
--    Replaces 5 separate JS round-trips with 1
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_pharmacy_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_start     timestamptz := date_trunc('day', now());
  v_week_ago        timestamptz := now() - interval '7 days';
  v_ninety_days     date        := (now() + interval '90 days')::date;
  v_today_sales     numeric     := 0;
  v_today_profit    numeric     := 0;
  v_active_sessions int         := 0;
  v_low_stock       int         := 0;
  v_expiring_soon   int         := 0;
  v_weekly_data     json;
BEGIN
  -- Today totals
  SELECT
    COALESCE(SUM(total), 0),
    COALESCE(SUM(profit_total), 0)
  INTO v_today_sales, v_today_profit
  FROM orders
  WHERE pharmacy_id = p_pharmacy_id
    AND status = 'completed'
    AND created_at >= v_today_start;

  -- Active sessions
  SELECT COUNT(*) INTO v_active_sessions
  FROM sessions
  WHERE pharmacy_id = p_pharmacy_id AND status = 'active';

  -- Low stock
  SELECT COUNT(*) INTO v_low_stock
  FROM product_inventory
  WHERE pharmacy_id = p_pharmacy_id AND total_quantity < 10;

  -- Expiring soon (batches with qty > 0 expiring within 90 days)
  SELECT COUNT(*) INTO v_expiring_soon
  FROM batches
  WHERE pharmacy_id = p_pharmacy_id
    AND quantity > 0
    AND expiry_date <= v_ninety_days;

  -- Weekly chart data (last 7 days, grouped by day)
  SELECT json_agg(row_to_json(d))
  INTO v_weekly_data
  FROM (
    SELECT
      to_char(day_series, 'Day') AS name,
      COALESCE(SUM(CASE WHEN o.payment_method <> 'debt' THEN o.total ELSE 0 END), 0) AS sales,
      COALESCE(SUM(CASE WHEN o.payment_method  = 'debt' THEN o.total ELSE 0 END), 0) AS debts
    FROM generate_series(
      (v_week_ago::date),
      CURRENT_DATE,
      '1 day'::interval
    ) AS day_series
    LEFT JOIN orders o
      ON o.pharmacy_id    = p_pharmacy_id
      AND o.status        = 'completed'
      AND date_trunc('day', o.created_at) = day_series
    GROUP BY day_series
    ORDER BY day_series
  ) d;

  RETURN json_build_object(
    'today_sales',     v_today_sales,
    'today_profit',    v_today_profit,
    'active_sessions', v_active_sessions,
    'low_stock',       v_low_stock,
    'expiring_soon',   v_expiring_soon,
    'weekly_data',     COALESCE(v_weekly_data, '[]'::json)
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 7. RPC: get_monthly_report
--    Returns pre-aggregated monthly data (instant)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_monthly_report(
  p_pharmacy_id uuid,
  p_year        int DEFAULT NULL,
  p_months_back int DEFAULT 12
)
RETURNS TABLE (
  year           int,
  month          int,
  month_name     text,
  total_revenue  numeric,
  total_cost     numeric,
  total_profit   numeric,
  total_orders   int,
  cash_revenue   numeric,
  debt_revenue   numeric,
  sadqah_revenue numeric,
  returns_total  numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.year,
    ms.month,
    to_char(make_date(ms.year, ms.month, 1), 'Month YYYY') AS month_name,
    ms.total_revenue,
    ms.total_cost,
    ms.total_profit,
    ms.total_orders,
    ms.cash_revenue,
    ms.debt_revenue,
    ms.sadqah_revenue,
    ms.returns_total
  FROM monthly_summaries ms
  WHERE ms.pharmacy_id = p_pharmacy_id
    AND (p_year IS NULL OR ms.year = p_year)
    AND make_date(ms.year, ms.month, 1) >= (date_trunc('month', now()) - (p_months_back || ' months')::interval)::date
  ORDER BY ms.year DESC, ms.month DESC;
END;
$$;

-- ─────────────────────────────────────────────
-- 8. RPC: fast_checkout
--    Handles full checkout atomically in DB
--    (stock deduction, order + items insert, debt update)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fast_checkout(
  p_pharmacy_id    uuid,
  p_user_id        uuid,
  p_cart           jsonb,      -- [{product_id, name, quantity, price, unit, cost_price, batch_distributions:[{batch_id,quantity,price,purchase_price}]}]
  p_total          numeric,
  p_payment_method text DEFAULT 'cash',
  p_customer_id    uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id       uuid;
  v_item           jsonb;
  v_dist           jsonb;
  v_batch          RECORD;
  v_batch_qty      int;
  v_deduction      int;
  v_remaining      int;
  v_cost_total     numeric := 0;
  v_revenue_total  numeric := 0;
  v_final_total    numeric;
  v_profit_total   numeric;
  v_customer       RECORD;
BEGIN
  -- ── Compute totals from distributions ──────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart)
  LOOP
    IF jsonb_array_length(COALESCE(v_item->'batch_distributions', '[]'::jsonb)) > 0 THEN
      FOR v_dist IN SELECT * FROM jsonb_array_elements(v_item->'batch_distributions')
      LOOP
        v_cost_total    := v_cost_total    + (v_dist->>'purchase_price')::numeric * (v_dist->>'quantity')::int;
        v_revenue_total := v_revenue_total + (v_dist->>'price')::numeric           * (v_dist->>'quantity')::int;
      END LOOP;
    ELSE
      v_cost_total    := v_cost_total    + COALESCE((v_item->>'cost_price')::numeric, 0)  * (v_item->>'quantity')::int;
      v_revenue_total := v_revenue_total + (v_item->>'price')::numeric * (v_item->>'quantity')::int;
    END IF;
  END LOOP;

  v_final_total  := CASE WHEN v_revenue_total > 0 THEN v_revenue_total ELSE p_total END;
  v_profit_total := v_final_total - v_cost_total;

  -- ── Insert order ───────────────────────────────────────
  INSERT INTO orders (
    pharmacy_id, total, cost_total, profit_total,
    customer_id, payment_method, status
  )
  VALUES (
    p_pharmacy_id, v_final_total, v_cost_total, v_profit_total,
    p_customer_id, p_payment_method, 'completed'
  )
  RETURNING id INTO v_order_id;

  -- ── Update customer debt ───────────────────────────────
  IF p_payment_method = 'debt' AND p_customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_debt = total_debt + v_final_total
    WHERE id = p_customer_id AND pharmacy_id = p_pharmacy_id;
  END IF;

  -- ── Deduct stock & insert order_items ──────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart)
  LOOP
    v_remaining := (v_item->>'quantity')::int;

    -- Explicit batch distributions first
    IF jsonb_array_length(COALESCE(v_item->'batch_distributions', '[]'::jsonb)) > 0 THEN
      FOR v_dist IN SELECT * FROM jsonb_array_elements(v_item->'batch_distributions')
      LOOP
        IF v_remaining <= 0 THEN EXIT; END IF;
        IF (v_dist->>'quantity')::int <= 0 THEN CONTINUE; END IF;

        v_deduction := LEAST((v_dist->>'quantity')::int, v_remaining);

        -- Deduct from specified batch
        UPDATE batches
        SET quantity = quantity - v_deduction
        WHERE id = (v_dist->>'batch_id')::uuid
          AND pharmacy_id = p_pharmacy_id
        RETURNING quantity INTO v_batch_qty;  -- just to confirm it happened

        -- Record item
        INSERT INTO order_items (order_id, product_id, batch_id, name, price, quantity, unit, pharmacy_id)
        VALUES (
          v_order_id,
          (v_item->>'product_id')::uuid,
          (v_dist->>'batch_id')::uuid,
          v_item->>'name',
          (v_dist->>'price')::numeric,
          v_deduction,
          v_item->>'unit',
          p_pharmacy_id
        );

        v_remaining := v_remaining - v_deduction;
      END LOOP;
    END IF;

    -- FEFO fallback for remaining quantity
    IF v_remaining > 0 THEN
      FOR v_batch IN
        SELECT id, quantity
        FROM batches
        WHERE product_id = (v_item->>'product_id')::uuid
          AND pharmacy_id = p_pharmacy_id
          AND quantity > 0
        ORDER BY expiry_date ASC
      LOOP
        IF v_remaining <= 0 THEN EXIT; END IF;

        v_deduction := LEAST(v_batch.quantity, v_remaining);

        UPDATE batches
        SET quantity = quantity - v_deduction
        WHERE id = v_batch.id AND pharmacy_id = p_pharmacy_id;

        INSERT INTO order_items (order_id, product_id, batch_id, name, price, quantity, unit, pharmacy_id)
        VALUES (
          v_order_id,
          (v_item->>'product_id')::uuid,
          v_batch.id,
          v_item->>'name',
          (v_item->>'price')::numeric,
          v_deduction,
          v_item->>'unit',
          p_pharmacy_id
        );

        v_remaining := v_remaining - v_deduction;
      END LOOP;
    END IF;
  END LOOP;

  RETURN json_build_object('order_id', v_order_id, 'total', v_final_total);
END;
$$;

-- ─────────────────────────────────────────────
-- 9. RPC: get_financial_stats
--    Replaces the JS aggregation in financials.ts
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_financial_stats(
  p_pharmacy_id uuid,
  p_days        int DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff        timestamptz := now() - (p_days || ' days')::interval;
  v_result        json;
BEGIN
  SELECT json_build_object(
    'total_sales',       COALESCE(SUM(total), 0),
    'total_cost',        COALESCE(SUM(cost_total), 0),
    'total_profit',      COALESCE(SUM(profit_total), 0),
    'total_transactions', COUNT(*),
    'cash_revenue',      COALESCE(SUM(CASE WHEN payment_method = 'cash'   THEN total ELSE 0 END), 0),
    'debt_revenue',      COALESCE(SUM(CASE WHEN payment_method = 'debt'   THEN total ELSE 0 END), 0),
    'sadqah_revenue',    COALESCE(SUM(CASE WHEN payment_method = 'sadqah' THEN total ELSE 0 END), 0),
    'daily_revenue', (
      SELECT json_agg(d ORDER BY d.date DESC)
      FROM (
        SELECT
          date_trunc('day', created_at)::date::text AS date,
          SUM(total)         AS revenue,
          SUM(profit_total)  AS profit
        FROM orders
        WHERE pharmacy_id = p_pharmacy_id
          AND status = 'completed'
          AND created_at >= v_cutoff
        GROUP BY date_trunc('day', created_at)::date
      ) d
    )
  )
  INTO v_result
  FROM orders
  WHERE pharmacy_id = p_pharmacy_id
    AND status = 'completed'
    AND created_at >= v_cutoff;

  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────
-- 10. Grant execute to authenticated users
-- ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_report(uuid, int, int)   TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_stats(uuid, int)       TO authenticated;
GRANT EXECUTE ON FUNCTION fast_checkout(uuid, uuid, jsonb, numeric, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_monthly_summary(uuid, int, int) TO authenticated;

-- Done!
-- Run this script once, then update your TypeScript API files.
