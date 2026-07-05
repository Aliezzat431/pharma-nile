-- ============================================================
-- PHARMANILE CONSOLIDATED SCHEMA & DATABASE SETUP
-- ============================================================

-- 1. SETUP EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP EVERYTHING EXISTING (CLEAN RESET)
DROP TRIGGER IF EXISTS trg_orders_monthly_summary ON orders CASCADE;
DROP TRIGGER IF EXISTS trg_stock_transfer_updated_at ON stock_transfers CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

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

DROP VIEW IF EXISTS product_inventory CASCADE;

DROP TABLE IF EXISTS inventory_snapshots CASCADE;
DROP TABLE IF EXISTS monthly_summaries CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock_transfers CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS debt_payments CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS pharmacy_settings CASCADE;
DROP TABLE IF EXISTS user_pharmacy_access CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS chains CASCADE;

-- 3. CORE TABLES

-- Chains Table
CREATE TABLE chains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  password text, -- Access password set by admin
  owner_id uuid, -- Links to owner user ID
  owner_email text,
  created_at timestamptz DEFAULT now()
);

-- Pharmacies (Branches)
CREATE TABLE pharmacies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id uuid REFERENCES chains(id) ON DELETE SET NULL,
  name text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Profiles (linked to auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE SET NULL,
  chain_id uuid REFERENCES chains(id) ON DELETE SET NULL,
  full_name text,
  role text DEFAULT 'staff',
  salary numeric DEFAULT 0,
  incentives numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User Pharmacy Access (Multi-tenancy support)
CREATE TABLE user_pharmacy_access (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  role text DEFAULT 'staff',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pharmacy_id)
);

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  barcode text,
  type text NOT NULL DEFAULT 'tablet',
  unit_conversion int DEFAULT 10,
  company_name text,
  category text,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pharmacy_id, barcode)
);

-- Batches
CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  barcode text,
  batch_number text,
  quantity int NOT NULL DEFAULT 0,
  expiry_date date,
  purchase_price numeric DEFAULT 0,
  sale_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  total_debt numeric DEFAULT 0,
  credit_limit numeric DEFAULT 5000,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total numeric NOT NULL DEFAULT 0,
  cost_total numeric DEFAULT 0,
  profit_total numeric DEFAULT 0,
  status text DEFAULT 'completed',
  payment_method text DEFAULT 'cash',
  created_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  name text,
  quantity int NOT NULL,
  price numeric NOT NULL,
  cost_price numeric DEFAULT 0,
  unit text,
  created_at timestamptz DEFAULT now()
);

-- Stock Transfers (التحويل بين الفروع)
CREATE TABLE stock_transfers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_pharmacy_id  uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  to_pharmacy_id    uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id          uuid REFERENCES batches(id) ON DELETE SET NULL,
  quantity          int NOT NULL CHECK (quantity > 0),
  status            text NOT NULL DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  notes             text,
  requested_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at      timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  CONSTRAINT chk_different_pharmacies CHECK (from_pharmacy_id <> to_pharmacy_id)
);

-- Pharmacy Settings
CREATE TABLE pharmacy_settings (
  pharmacy_id             uuid PRIMARY KEY REFERENCES pharmacies(id) ON DELETE CASCADE,
  pharmacy_name           text,
  email                  text,
  phone                  text,
  address                text,
  inventory_method       text DEFAULT 'FEFO',
  stock_alert_threshold  int DEFAULT 20, 
  tax_percentage         numeric DEFAULT 14,
  printer_size           text DEFAULT '80mm',
  return_days_limit      int DEFAULT 14,
  email_reports          boolean DEFAULT true,
  expiry_alerts          boolean DEFAULT false,
  updated_at             timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Financial Transactions
CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  category text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Debt Payments
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  debtor_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'cash',
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'active',
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz
);

-- Monthly Summaries Table
CREATE TABLE monthly_summaries (
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

-- Inventory Snapshots Table
CREATE TABLE inventory_snapshots (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id     uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  snapshot_date   date NOT NULL DEFAULT CURRENT_DATE,
  quantity        int NOT NULL DEFAULT 0,
  total_value     numeric(14,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, product_id, snapshot_date)
);

-- 4. VIEWS

-- Product Inventory View
CREATE OR REPLACE VIEW product_inventory AS
SELECT 
    p.id,
    p.pharmacy_id,
    p.name,
    p.type,
    p.barcode as product_barcode,
    p.price,
    p.company_name as company,
    COALESCE(SUM(b.quantity), 0) as total_quantity
FROM products p
LEFT JOIN batches b ON p.id = b.product_id AND b.pharmacy_id = p.pharmacy_id
GROUP BY p.id, p.pharmacy_id, p.name, p.type, p.barcode, p.price, p.company_name;


-- 5. INDEXES (Optimization)
CREATE INDEX idx_orders_pharmacy_created ON orders (pharmacy_id, created_at DESC);
CREATE INDEX idx_orders_pharmacy_status ON orders (pharmacy_id, status);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_pharmacy_product ON order_items (pharmacy_id, product_id);
CREATE INDEX idx_batches_product_pharmacy_qty ON batches (product_id, pharmacy_id, quantity DESC);
CREATE INDEX idx_batches_pharmacy_expiry ON batches (pharmacy_id, expiry_date ASC) WHERE quantity > 0;
CREATE INDEX idx_products_pharmacy_name ON products (pharmacy_id, name);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_monthly_summaries_pharmacy_year_month ON monthly_summaries (pharmacy_id, year DESC, month DESC);
CREATE INDEX idx_snapshots_pharmacy_product_date ON inventory_snapshots (pharmacy_id, product_id, snapshot_date DESC);

-- Stock Transfers Indexes
CREATE INDEX idx_stock_transfers_from ON stock_transfers(from_pharmacy_id);
CREATE INDEX idx_stock_transfers_to ON stock_transfers(to_pharmacy_id);
CREATE INDEX idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_created_at ON stock_transfers(created_at DESC);
CREATE INDEX idx_stock_transfers_pharmacy_status ON stock_transfers(from_pharmacy_id, status);


-- 6. DYNAMIC HELPER FUNCTIONS & TRIGGERS

-- Get My Pharmacy ID Helper
CREATE OR REPLACE FUNCTION get_my_pharmacy_id() RETURNS uuid AS $$
DECLARE
  v_pharmacy_id uuid;
BEGIN
  v_pharmacy_id := (auth.jwt()->'user_metadata'->>'pharmacy_id')::uuid;
  
  IF v_pharmacy_id IS NULL THEN
    SELECT pharmacy_id INTO v_pharmacy_id 
    FROM user_pharmacy_access 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  END IF;
  
  RETURN v_pharmacy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Chain Password Secure Verification Function (Prevents password leaks to FE)
CREATE OR REPLACE FUNCTION verify_chain_password(p_chain_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match boolean;
BEGIN
  SELECT (password = p_password) INTO v_match
  FROM chains
  WHERE id = p_chain_id;

  RETURN COALESCE(v_match, false);
END;
$$;

-- Upsert Monthly Summary
CREATE OR REPLACE FUNCTION upsert_monthly_summary(p_pharmacy_id uuid, p_year int, p_month int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO monthly_summaries (pharmacy_id, year, month, total_revenue, total_cost, total_profit, total_orders, cash_revenue, debt_revenue, sadqah_revenue, returns_total, updated_at)
  SELECT p_pharmacy_id, p_year, p_month,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' THEN cost_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' THEN profit_total ELSE 0 END), 0),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'debt' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'sadqah' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'returned' THEN total ELSE 0 END), 0),
    now()
  FROM orders WHERE pharmacy_id = p_pharmacy_id AND EXTRACT(YEAR FROM created_at) = p_year AND EXTRACT(MONTH FROM created_at) = p_month
  ON CONFLICT (pharmacy_id, year, month) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue, total_cost = EXCLUDED.total_cost, total_profit = EXCLUDED.total_profit, total_orders = EXCLUDED.total_orders, cash_revenue = EXCLUDED.cash_revenue, debt_revenue = EXCLUDED.debt_revenue, sadqah_revenue = EXCLUDED.sadqah_revenue, returns_total = EXCLUDED.returns_total, updated_at = now();
END; $$;

-- Trigger logic for summary refreshes
CREATE OR REPLACE FUNCTION trigger_refresh_monthly_summary()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM upsert_monthly_summary(NEW.pharmacy_id, EXTRACT(YEAR FROM NEW.created_at)::int, EXTRACT(MONTH FROM NEW.created_at)::int);
  IF TG_OP = 'UPDATE' AND (EXTRACT(MONTH FROM OLD.created_at) <> EXTRACT(MONTH FROM NEW.created_at) OR EXTRACT(YEAR FROM OLD.created_at) <> EXTRACT(YEAR FROM NEW.created_at)) THEN
    PERFORM upsert_monthly_summary(OLD.pharmacy_id, EXTRACT(YEAR FROM OLD.created_at)::int, EXTRACT(MONTH FROM OLD.created_at)::int);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_orders_monthly_summary
  AFTER INSERT OR UPDATE OF status, total, cost_total, profit_total, payment_method
  ON orders FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_summary();

-- Store analytics/dashboard function
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_pharmacy_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today_start timestamptz := date_trunc('day', now());
  v_week_ago timestamptz := now() - interval '7 days';
  v_ninety_days date := (now() + interval '90 days')::date;
  v_today_sales numeric := 0; 
  v_today_profit numeric := 0; 
  v_active_sessions int := 0; 
  v_low_stock int := 0; 
  v_expiring_soon int := 0; 
  v_weekly_data json; 
  v_threshold int;
BEGIN
  SELECT COALESCE(stock_alert_threshold, 20) INTO v_threshold FROM pharmacy_settings WHERE pharmacy_id = p_pharmacy_id;
  SELECT COALESCE(SUM(total), 0), COALESCE(SUM(profit_total), 0) INTO v_today_sales, v_today_profit FROM orders WHERE pharmacy_id = p_pharmacy_id AND status = 'completed' AND created_at >= v_today_start;
  SELECT COUNT(*) INTO v_active_sessions FROM sessions WHERE pharmacy_id = p_pharmacy_id AND status = 'active';
  SELECT COUNT(*) INTO v_low_stock FROM product_inventory WHERE pharmacy_id = p_pharmacy_id AND total_quantity < v_threshold;
  SELECT COUNT(*) INTO v_expiring_soon FROM batches WHERE pharmacy_id = p_pharmacy_id AND quantity > 0 AND expiry_date <= v_ninety_days;
  
  SELECT json_agg(row_to_json(d)) INTO v_weekly_data FROM (
    SELECT to_char(day_series, 'Day') AS name, 
           COALESCE(SUM(CASE WHEN o.payment_method <> 'debt' THEN o.total ELSE 0 END), 0) AS sales, 
           COALESCE(SUM(CASE WHEN o.payment_method = 'debt' THEN o.total ELSE 0 END), 0) AS debts
    FROM generate_series((v_week_ago::date), CURRENT_DATE, '1 day'::interval) AS day_series
    LEFT JOIN orders o ON o.pharmacy_id = p_pharmacy_id AND o.status = 'completed' AND date_trunc('day', o.created_at) = day_series
    GROUP BY day_series ORDER BY day_series
  ) d;
  
  RETURN json_build_object('today_sales', v_today_sales, 'today_profit', v_today_profit, 'active_sessions', v_active_sessions, 'low_stock', v_low_stock, 'expiring_soon', v_expiring_soon, 'weekly_data', COALESCE(v_weekly_data, '[]'::json));
END; $$;

-- Smart Search
CREATE OR REPLACE FUNCTION smart_search(p_pharmacy_id uuid, p_query text, p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE (id uuid, name text, barcode text, price numeric, quantity int, company_name text, match_score float4)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT p.id, p.name, b.barcode, p.price, COALESCE(SUM(b.quantity), 0) as quantity, p.company_name, ts_rank_cd(to_tsvector('simple', p.name), plainto_tsquery('simple', p_query)) as score
  FROM products p LEFT JOIN batches b ON p.id = b.product_id AND b.pharmacy_id = p_pharmacy_id AND b.quantity > 0
  WHERE p.pharmacy_id = p_pharmacy_id AND (p.name ILIKE '%' || p_query || '%' OR b.barcode ILIKE '%' || p_query || '%' OR p.company_name ILIKE '%' || p_query || '%')
  GROUP BY p.id, b.barcode ORDER BY score DESC, p.name ASC LIMIT p_limit OFFSET p_offset;
END; $$;

-- Fast Checkout
CREATE OR REPLACE FUNCTION fast_checkout(p_pharmacy_id uuid, p_customer_id uuid, p_cart jsonb, p_total numeric, p_payment_method text, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id uuid; v_item jsonb; v_dist jsonb; v_batch RECORD; v_deduction int; v_remaining int; v_cost_total numeric := 0; v_revenue_total numeric := 0; v_final_total numeric; v_profit_total numeric; v_method text;
BEGIN
  SELECT COALESCE(inventory_method, 'FEFO') INTO v_method FROM pharmacy_settings WHERE pharmacy_id = p_pharmacy_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart) LOOP
    IF jsonb_array_length(COALESCE(v_item->'batch_distributions', '[]'::jsonb)) > 0 THEN
      FOR v_dist IN SELECT * FROM jsonb_array_elements(v_item->'batch_distributions') LOOP v_cost_total := v_cost_total + (v_dist->>'purchase_price')::numeric * (v_dist->>'quantity')::int; v_revenue_total := v_revenue_total + (v_dist->>'price')::numeric * (v_dist->>'quantity')::int; END LOOP;
    ELSE
      v_cost_total := v_cost_total + COALESCE((v_item->>'cost_price')::numeric, 0) * (v_item->>'quantity')::int; v_revenue_total := v_revenue_total + (v_item->>'price')::numeric * (v_item->>'quantity')::int;
    END IF;
  END LOOP;
  v_final_total := CASE WHEN v_revenue_total > 0 THEN v_revenue_total ELSE p_total END; v_profit_total := v_final_total - v_cost_total;
  INSERT INTO orders (pharmacy_id, total, cost_total, profit_total, customer_id, payment_method, status) VALUES (p_pharmacy_id, v_final_total, v_cost_total, v_profit_total, p_customer_id, p_payment_method, 'completed') RETURNING id INTO v_order_id;
  IF p_payment_method = 'debt' AND p_customer_id IS NOT NULL THEN UPDATE customers SET total_debt = total_debt + v_final_total WHERE id = p_customer_id AND pharmacy_id = p_pharmacy_id; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart) LOOP v_remaining := (v_item->>'quantity')::int;
    IF jsonb_array_length(COALESCE(v_item->'batch_distributions', '[]'::jsonb)) > 0 THEN
      FOR v_dist IN SELECT * FROM jsonb_array_elements(v_item->'batch_distributions') LOOP IF v_remaining <= 0 THEN EXIT; END IF; v_deduction := LEAST((v_dist->>'quantity')::int, v_remaining); UPDATE batches SET quantity = quantity - v_deduction WHERE id = (v_dist->>'batch_id')::uuid AND pharmacy_id = p_pharmacy_id;
      INSERT INTO order_items (order_id, product_id, batch_id, name, price, quantity, unit, pharmacy_id) VALUES (v_order_id, (v_item->>'product_id')::uuid, (v_dist->>'batch_id')::uuid, v_item->>'name', (v_dist->>'price')::numeric, v_deduction, v_item->>'unit', p_pharmacy_id); v_remaining := v_remaining - v_deduction; END LOOP;
    END IF;
    IF v_remaining > 0 THEN 
      FOR v_batch IN SELECT id, quantity FROM batches WHERE product_id = (v_item->>'product_id')::uuid AND pharmacy_id = p_pharmacy_id AND quantity > 0 ORDER BY CASE WHEN v_method = 'FEFO' THEN expiry_date::text WHEN v_method = 'FIFO' THEN created_at::text ELSE NULL END ASC, CASE WHEN v_method = 'LIFO' THEN created_at::text ELSE NULL END DESC LOOP
        IF v_remaining <= 0 THEN EXIT; END IF; v_deduction := LEAST(v_batch.quantity, v_remaining); UPDATE batches SET quantity = quantity - v_deduction WHERE id = v_batch.id AND pharmacy_id = p_pharmacy_id;
        INSERT INTO order_items (order_id, product_id, batch_id, name, price, quantity, unit, pharmacy_id) VALUES (v_order_id, (v_item->>'product_id')::uuid, v_batch.id, v_item->>'name', (v_item->>'price')::numeric, v_deduction, v_item->>'unit', p_pharmacy_id); v_remaining := v_remaining - v_deduction; END LOOP;
    END IF;
  END LOOP;
  RETURN json_build_object('order_id', v_order_id, 'total', v_final_total);
END; $$;

-- Stock Transfers Functions
CREATE OR REPLACE FUNCTION complete_stock_transfer(p_transfer_id uuid, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transfer RECORD;
  v_batch_id uuid;
  v_available_qty int;
  v_from_pharmacy uuid;
  v_to_pharmacy uuid;
BEGIN
  SELECT * INTO v_transfer FROM stock_transfers WHERE id = p_transfer_id AND status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer not found or not approved'; END IF;
  
  v_from_pharmacy := v_transfer.from_pharmacy_id;
  v_to_pharmacy := v_transfer.to_pharmacy_id;
  
  IF v_transfer.batch_id IS NOT NULL THEN
    SELECT quantity INTO v_available_qty FROM batches WHERE id = v_transfer.batch_id AND pharmacy_id = v_from_pharmacy;
    IF COALESCE(v_available_qty, 0) < v_transfer.quantity THEN
      RAISE EXCEPTION 'Insufficient stock in specified batch. Available: %, Requested: %', COALESCE(v_available_qty, 0), v_transfer.quantity;
    END IF;
    UPDATE batches SET quantity = quantity - v_transfer.quantity WHERE id = v_transfer.batch_id;
    INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price)
    SELECT product_id, v_to_pharmacy, barcode, batch_number, v_transfer.quantity, expiry_date, purchase_price, sale_price FROM batches WHERE id = v_transfer.batch_id;
    v_batch_id := v_transfer.batch_id;
  ELSE
    SELECT COALESCE(SUM(quantity), 0) INTO v_available_qty FROM batches WHERE product_id = v_transfer.product_id AND pharmacy_id = v_from_pharmacy AND quantity > 0;
    IF v_available_qty < v_transfer.quantity THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_available_qty, v_transfer.quantity;
    END IF;
    DECLARE
      v_remaining int := v_transfer.quantity;
      v_batch RECORD;
    BEGIN
      FOR v_batch IN SELECT id, quantity FROM batches WHERE product_id = v_transfer.product_id AND pharmacy_id = v_from_pharmacy AND quantity > 0 ORDER BY expiry_date ASC NULLS LAST, created_at ASC LOOP
        IF v_remaining <= 0 THEN EXIT; END IF;
        DECLARE v_deduction int := LEAST(v_batch.quantity, v_remaining);
        BEGIN
          UPDATE batches SET quantity = quantity - v_deduction WHERE id = v_batch.id;
          v_remaining := v_remaining - v_deduction;
        END;
      END LOOP;
      INSERT INTO batches (product_id, pharmacy_id, quantity, purchase_price, sale_price)
      SELECT id, v_to_pharmacy, v_transfer.quantity, price, price FROM products WHERE id = v_transfer.product_id RETURNING id INTO v_batch_id;
    END;
  END IF;
  
  UPDATE stock_transfers SET status = 'completed', completed_at = now(), approved_by = p_user_id, updated_at = now() WHERE id = p_transfer_id;
  INSERT INTO audit_logs (pharmacy_id, user_id, action, entity_type, entity_id, new_data) VALUES (v_from_pharmacy, p_user_id, 'stock_transfer_completed', 'stock_transfer', p_transfer_id::text, jsonb_build_object('to_pharmacy_id', v_to_pharmacy, 'product_id', v_transfer.product_id, 'quantity', v_transfer.quantity));
  RETURN json_build_object('success', true, 'transfer_id', p_transfer_id, 'status', 'completed');
END; $$;

CREATE OR REPLACE FUNCTION update_stock_transfer_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_stock_transfer_updated_at BEFORE UPDATE ON stock_transfers FOR EACH ROW EXECUTE FUNCTION update_stock_transfer_timestamp();

-- Bulk Import Inventory
CREATE OR REPLACE FUNCTION bulk_import_inventory(p_pharmacy_id uuid, p_category text, p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item jsonb; v_product_id uuid; v_count int := 0; v_errors jsonb := '[]'::jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    BEGIN
      INSERT INTO products (pharmacy_id, name, barcode, company_name, price, category, type, unit_conversion)
      VALUES (p_pharmacy_id, trim(v_item->>'name'), trim(v_item->>'barcode'), trim(COALESCE(v_item->>'company', 'غير محدد')), COALESCE((v_item->>'sale_price')::numeric, (v_item->>'selling_price')::numeric, 0), p_category, COALESCE(v_item->>'type', 'tablet'), COALESCE((v_item->>'unit_quantity')::int, 1))
      ON CONFLICT (pharmacy_id, barcode) DO UPDATE SET name = EXCLUDED.name, company_name = EXCLUDED.company_name, price = EXCLUDED.price, category = EXCLUDED.category, type = EXCLUDED.type, unit_conversion = EXCLUDED.unit_conversion
      RETURNING id INTO v_product_id;

      INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price)
      VALUES (v_product_id, p_pharmacy_id, trim(v_item->>'barcode'), 'IMP-' || upper(substring(md5(random()::text), 1, 8)), 0, NULLIF(trim(COALESCE(v_item->>'expiry_date', '')), '')::date, COALESCE((v_item->>'purchase_price')::numeric, 0), COALESCE((v_item->>'sale_price')::numeric, (v_item->>'selling_price')::numeric, 0));
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('item', COALESCE(v_item->>'name', 'unknown'), 'barcode', COALESCE(v_item->>'barcode', 'unknown'), 'error', SQLERRM);
    END;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'count', v_count, 'errors', v_errors);
END; $$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pharmacy_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;

-- CHAINS
CREATE POLICY "Allow public select for chains" ON chains FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow chain admins to update their own chain" ON chains FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Allow chain admins to insert their chain" ON chains FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- PHARMACIES
CREATE POLICY "Allow public read for active pharmacies" ON pharmacies FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Allow chain admins to view pharmacies in their chain" ON pharmacies FOR SELECT TO authenticated USING (chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Allow chain admins to insert pharmacies for their chain" ON pharmacies FOR INSERT TO authenticated WITH CHECK (chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Allow chain admins to update pharmacies in their chain" ON pharmacies FOR UPDATE TO authenticated USING (chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid())) WITH CHECK (chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid()));

-- PRODUCTS
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated USING (pharmacy_id = get_my_pharmacy_id()) WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "products_delete" ON products FOR DELETE TO authenticated USING (pharmacy_id = get_my_pharmacy_id());

-- BATCHES
CREATE POLICY "batches_select" ON batches FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "batches_insert" ON batches FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "batches_update" ON batches FOR UPDATE TO authenticated USING (pharmacy_id = get_my_pharmacy_id()) WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "batches_delete" ON batches FOR DELETE TO authenticated USING (pharmacy_id = get_my_pharmacy_id());

-- ORDERS
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated USING (pharmacy_id = get_my_pharmacy_id()) WITH CHECK (pharmacy_id = get_my_pharmacy_id());

-- ORDER ITEMS
CREATE POLICY "items_select" ON order_items FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "items_insert" ON order_items FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());

-- STOCK TRANSFERS
CREATE POLICY "stock_transfers_select" ON stock_transfers FOR SELECT TO authenticated USING (from_pharmacy_id = get_my_pharmacy_id() OR to_pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "stock_transfers_insert" ON stock_transfers FOR INSERT TO authenticated WITH CHECK (from_pharmacy_id = get_my_pharmacy_id() AND requested_by = auth.uid());
CREATE POLICY "stock_transfers_update" ON stock_transfers FOR UPDATE TO authenticated USING (from_pharmacy_id = get_my_pharmacy_id() OR to_pharmacy_id = get_my_pharmacy_id()) WITH CHECK (from_pharmacy_id = get_my_pharmacy_id() OR to_pharmacy_id = get_my_pharmacy_id());

-- CUSTOMERS
CREATE POLICY "customers_select" ON customers FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "customers_insert" ON customers FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "customers_update" ON customers FOR UPDATE TO authenticated USING (pharmacy_id = get_my_pharmacy_id()) WITH CHECK (pharmacy_id = get_my_pharmacy_id());

-- PHARMACY SETTINGS
CREATE POLICY "settings_select" ON pharmacy_settings FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "settings_insert" ON pharmacy_settings FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "settings_update" ON pharmacy_settings FOR UPDATE TO authenticated USING (pharmacy_id = get_my_pharmacy_id()) WITH CHECK (pharmacy_id = get_my_pharmacy_id());

-- FINANCIALS
CREATE POLICY "finance_select" ON financial_transactions FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "finance_insert" ON financial_transactions FOR INSERT TO authenticated WITH CHECK (pharmacy_id = get_my_pharmacy_id());

-- SUMMARIES & LOGS
CREATE POLICY "summaries_select" ON monthly_summaries FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "audit_select" ON audit_logs FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "snapshots_select" ON inventory_snapshots FOR SELECT TO authenticated USING (pharmacy_id = get_my_pharmacy_id());

-- PROFILES & ACCESS
CREATE POLICY "profiles_select_own" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON user_profiles FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "access_select_own" ON user_pharmacy_access FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "access_insert_own" ON user_pharmacy_access FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "access_update_own" ON user_pharmacy_access FOR UPDATE TO authenticated USING (user_id = auth.uid());


-- 8. TRIGGER FOR USER REGISTRATION (Respects roles, chains, and branches)
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_full_name text;
  v_role text;
  v_pharmacy_id uuid;
  v_chain_id uuid;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'صيدلي نيل جديد');
  v_role      := COALESCE(new.raw_user_meta_data->>'role', 'staff');
  v_pharmacy_id := (new.raw_user_meta_data->>'pharmacy_id')::uuid;
  v_chain_id := (new.raw_user_meta_data->>'chain_id')::uuid;

  IF v_role = 'admin' OR v_role = 'chain_admin' THEN
    INSERT INTO public.user_profiles (id, pharmacy_id, chain_id, full_name, role)
    VALUES (new.id, null, v_chain_id, v_full_name, 'admin')
    ON CONFLICT (id) DO UPDATE SET pharmacy_id = null, chain_id = EXCLUDED.chain_id, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
  ELSIF v_pharmacy_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.pharmacies WHERE id = v_pharmacy_id) THEN
    IF v_chain_id IS NULL THEN
      SELECT chain_id INTO v_chain_id FROM public.pharmacies WHERE id = v_pharmacy_id;
    END IF;

    INSERT INTO public.user_profiles (id, pharmacy_id, chain_id, full_name, role)
    VALUES (new.id, v_pharmacy_id, v_chain_id, v_full_name, v_role)
    ON CONFLICT (id) DO UPDATE SET pharmacy_id = EXCLUDED.pharmacy_id, chain_id = EXCLUDED.chain_id, full_name = EXCLUDED.full_name, role = EXCLUDED.role;

    INSERT INTO public.user_pharmacy_access (user_id, pharmacy_id, role, is_primary)
    VALUES (new.id, v_pharmacy_id, v_role, true)
    ON CONFLICT (user_id, pharmacy_id) DO NOTHING;
  END IF;
  RETURN new;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();


-- 9. DEFAULTS & PERMISSIONS GRANTS
GRANT ALL PRIVILEGES ON TABLE pharmacies TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE user_profiles TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE user_pharmacy_access TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE chains TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE products TO authenticated;
GRANT ALL ON TABLE batches TO authenticated;
GRANT ALL ON TABLE orders TO authenticated;
GRANT ALL ON TABLE order_items TO authenticated;
GRANT ALL ON TABLE customers TO authenticated;
GRANT ALL ON TABLE pharmacy_settings TO authenticated;
GRANT ALL ON TABLE audit_logs TO authenticated;
GRANT ALL ON TABLE financial_transactions TO authenticated;
GRANT ALL ON TABLE debt_payments TO authenticated;
GRANT ALL ON TABLE sessions TO authenticated;
GRANT ALL ON TABLE monthly_summaries TO authenticated;
GRANT ALL ON TABLE inventory_snapshots TO authenticated;
GRANT ALL ON TABLE stock_transfers TO authenticated;

GRANT SELECT ON TABLE product_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION smart_search TO authenticated;
GRANT EXECUTE ON FUNCTION fast_checkout TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION complete_stock_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_import_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION verify_chain_password TO anon, authenticated;
