-- ============================================================
-- PHARMANILE CORE SCHEMA SETUP
-- Run this BEFORE database_optimization.sql
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'staff',
  salary numeric DEFAULT 0,
  incentives numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  barcode text,
  type text NOT NULL DEFAULT 'tablet',
  unit_conversion int DEFAULT 10,
  company_name text,
  category text,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batches (
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

CREATE TABLE IF NOT EXISTS customers (
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

CREATE TABLE IF NOT EXISTS orders (
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

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  quantity int NOT NULL,
  price numeric NOT NULL,
  cost_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pharmacy_settings (
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

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'income', 'expense'
  amount numeric NOT NULL,
  category text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  debtor_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'cash',
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'active',
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz
);

-- ============================================================
-- NOTE: AFTER RUNNING THIS, RUN database_optimization.sql
-- ============================================================
