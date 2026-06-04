-- ==========================================
-- MASTER DATABASE SETUP FILE
-- Combines Schema, Auth Fixes, RLS Policies, 
-- and Custom RPCs (like Database Usage)
-- Includes Multi-Tenancy (Multi-Pharmacy) strict isolation
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1. Pharmacies & Multi-Tenancy
----------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_pharmacy_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(user_id, pharmacy_id)
);

----------------------------------------------------
-- 2. Companies
----------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------
-- 3. Products
----------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_conversion NUMERIC DEFAULT 1,
  company TEXT,
  inventory_method TEXT CHECK (inventory_method IN ('FEFO', 'FIFO', 'LIFO')) DEFAULT 'FEFO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_pharmacy ON products(pharmacy_id);

----------------------------------------------------
-- 4. Batches
----------------------------------------------------
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
  selling_price NUMERIC NOT NULL CHECK (selling_price >= 0),
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_barcode ON batches(barcode);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_pharmacy ON batches(pharmacy_id);

----------------------------------------------------
-- 5. Customers (and Debtors combined functionally)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_debt NUMERIC DEFAULT 0 CHECK (total_debt >= 0),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debtors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  total_debt NUMERIC DEFAULT 0 CHECK (total_debt >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_pharmacy ON customers(pharmacy_id);

----------------------------------------------------
-- 6. Orders
----------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'debt', 'sadqah')) DEFAULT 'cash',
  status TEXT CHECK (status IN ('completed', 'cancelled', 'returned')) DEFAULT 'completed',
  total NUMERIC NOT NULL CHECK (total >= 0),
  cost_total NUMERIC DEFAULT 0,
  profit_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON orders(pharmacy_id);

----------------------------------------------------
-- 7. Order Items
----------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  batch_id UUID REFERENCES batches(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_pharmacy ON order_items(pharmacy_id);

----------------------------------------------------
-- 8. Sessions (Shifts)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'night')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_pharmacy ON sessions(pharmacy_id);

----------------------------------------------------
-- 9. User Profiles (Auth Link)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  pharmacy_id TEXT, -- Legacy mapping or direct representation from user_pharmacy_access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------
-- 10. Debt Payments
----------------------------------------------------
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  debtor_id UUID REFERENCES debtors(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_type TEXT CHECK (payment_type IN ('partial', 'full')) NOT NULL,
  note TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_pharmacy ON debt_payments(pharmacy_id);

----------------------------------------------------
-- 11. Audit Logs
----------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_pharmacy ON audit_logs(pharmacy_id);

----------------------------------------------------
-- 12. Product Inventory View
----------------------------------------------------
-- 11b. Stock Transfers
----------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  to_pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  status TEXT CHECK (status IN ('pending', 'shipped', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_from ON stock_transfers(from_pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to ON stock_transfers(to_pharmacy_id);

----------------------------------------------------
DROP VIEW IF EXISTS product_inventory;
CREATE OR REPLACE VIEW product_inventory AS
SELECT 
  p.pharmacy_id,
  p.id AS product_id,
  p.name,
  COALESCE(SUM(b.quantity), 0) AS total_quantity,
  (
    SELECT b2.selling_price
    FROM batches b2
    WHERE b2.product_id = p.id AND b2.quantity > 0 AND b2.pharmacy_id = p.pharmacy_id
    ORDER BY b2.expiry_date ASC
    LIMIT 1
  ) AS current_price
FROM products p
LEFT JOIN batches b ON p.id = b.product_id
GROUP BY p.pharmacy_id, p.id, p.name;

----------------------------------------------------
-- 13. Enable Row Level Security (RLS)
----------------------------------------------------
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pharmacy_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

----------------------------------------------------
-- 14. Essential Global RLS Policies (STRICT ISOLATION)
----------------------------------------------------

-- Pharmacies
DROP POLICY IF EXISTS "anon_view_active_pharmacies" ON pharmacies;
CREATE POLICY "anon_view_active_pharmacies" ON pharmacies FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "anon_insert_pharmacies" ON pharmacies;
CREATE POLICY "anon_insert_pharmacies" ON pharmacies FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_pharmacies" ON pharmacies;
CREATE POLICY "auth_insert_pharmacies" ON pharmacies FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_view_own_pharmacies" ON pharmacies;
CREATE POLICY "auth_view_own_pharmacies" ON pharmacies FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_pharmacy_access WHERE pharmacy_id = pharmacies.id AND user_id = auth.uid())
);

-- User Access
DROP POLICY IF EXISTS "auth_view_own_access" ON user_pharmacy_access;
CREATE POLICY "auth_view_own_access" ON user_pharmacy_access FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "auth_insert_own_access" ON user_pharmacy_access;
CREATE POLICY "auth_insert_own_access" ON user_pharmacy_access FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- User Profiles
DROP POLICY IF EXISTS "auth_insert_own_profile" ON user_profiles;
CREATE POLICY "auth_insert_own_profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "auth_update_own_profile" ON user_profiles;
CREATE POLICY "auth_update_own_profile" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "auth_select_own_profile" ON user_profiles;
CREATE POLICY "auth_select_own_profile" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());

GRANT SELECT, INSERT ON pharmacies TO anon;
GRANT SELECT, INSERT ON pharmacies TO authenticated;
GRANT SELECT, INSERT ON user_pharmacy_access TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;


-- ==========================================
-- TENANT ISOLATION POLICIES (RLS MAGIC)
-- Uses the auth.jwt() -> 'user_metadata' ->> 'pharmacy_id' injected safely by Supabase Auth
-- ==========================================

-- Products
DROP POLICY IF EXISTS "tenant_isolation_products" ON products;
CREATE POLICY "tenant_isolation_products" ON products FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' OR EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = products.pharmacy_id)) WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' OR EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = products.pharmacy_id));
GRANT ALL ON products TO authenticated;

-- Batches
DROP POLICY IF EXISTS "tenant_isolation_batches" ON batches;
CREATE POLICY "tenant_isolation_batches" ON batches FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' OR EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = batches.pharmacy_id)) WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' OR EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = batches.pharmacy_id));
GRANT ALL ON batches TO authenticated;

-- Customers & Debtors
DROP POLICY IF EXISTS "tenant_isolation_customers" ON customers;
CREATE POLICY "tenant_isolation_customers" ON customers FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON customers TO authenticated;

DROP POLICY IF EXISTS "tenant_isolation_debtors" ON debtors;
CREATE POLICY "tenant_isolation_debtors" ON debtors FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON debtors TO authenticated;

-- Orders & Items
DROP POLICY IF EXISTS "tenant_isolation_orders" ON orders;
CREATE POLICY "tenant_isolation_orders" ON orders FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON orders TO authenticated;

DROP POLICY IF EXISTS "tenant_isolation_order_items" ON order_items;
CREATE POLICY "tenant_isolation_order_items" ON order_items FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON order_items TO authenticated;

-- Debt Payments
DROP POLICY IF EXISTS "tenant_isolation_debt_payments" ON debt_payments;
CREATE POLICY "tenant_isolation_debt_payments" ON debt_payments FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON debt_payments TO authenticated;

-- Sessions
DROP POLICY IF EXISTS "tenant_isolation_sessions" ON sessions;
CREATE POLICY "tenant_isolation_sessions" ON sessions FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON sessions TO authenticated;

-- Companies
DROP POLICY IF EXISTS "tenant_isolation_companies" ON companies;
CREATE POLICY "tenant_isolation_companies" ON companies FOR ALL TO authenticated USING (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id') WITH CHECK (pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id');
GRANT ALL ON companies TO authenticated;

-- Stock Transfers (Between Pharmacies)
DROP POLICY IF EXISTS "stock_transfers_select" ON stock_transfers;
CREATE POLICY "stock_transfers_select" ON stock_transfers FOR SELECT TO authenticated USING (
  from_pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' 
  OR 
  to_pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id'
  OR 
  EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = from_pharmacy_id)
  OR
  EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = to_pharmacy_id)
);

DROP POLICY IF EXISTS "stock_transfers_insert" ON stock_transfers;
CREATE POLICY "stock_transfers_insert" ON stock_transfers FOR INSERT TO authenticated WITH CHECK (
  from_pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' 
  OR 
  to_pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id'
  OR 
  EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = from_pharmacy_id)
  OR
  EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = to_pharmacy_id)
);

DROP POLICY IF EXISTS "stock_transfers_update" ON stock_transfers;
CREATE POLICY "stock_transfers_update" ON stock_transfers FOR UPDATE TO authenticated USING (
  from_pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id' 
  OR 
  to_pharmacy_id::text = auth.jwt()->'user_metadata'->>'pharmacy_id'
  OR 
  EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = from_pharmacy_id)
  OR
  EXISTS(SELECT 1 FROM user_pharmacy_access u WHERE u.user_id = auth.uid() AND u.pharmacy_id = to_pharmacy_id)
);

GRANT SELECT, INSERT, UPDATE ON stock_transfers TO authenticated;

----------------------------------------------------
-- 14b. Global Inventory RPC
----------------------------------------------------
CREATE OR REPLACE FUNCTION find_product_in_other_pharmacies(search_term TEXT, current_pharmacy_id UUID)
RETURNS TABLE (
  pharmacy_id UUID,
  pharmacy_name TEXT,
  product_id UUID,
  product_name TEXT,
  total_quantity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.pharmacy_id,
    ph.name AS pharmacy_name,
    p.id AS product_id,
    p.name AS product_name,
    COALESCE(SUM(b.quantity), 0) AS total_quantity
  FROM products p
  JOIN pharmacies ph ON p.pharmacy_id = ph.id
  LEFT JOIN batches b ON p.id = b.product_id
  WHERE p.pharmacy_id != current_pharmacy_id
  AND p.name ILIKE '%' || search_term || '%'
  GROUP BY p.pharmacy_id, ph.name, p.id, p.name
  HAVING COALESCE(SUM(b.quantity), 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


----------------------------------------------------
-- 15. Custom DB Usage Size Function
----------------------------------------------------
CREATE OR REPLACE FUNCTION get_db_size() 
RETURNS bigint AS $$
  SELECT pg_database_size('postgres');
$$ LANGUAGE sql SECURITY DEFINER;
