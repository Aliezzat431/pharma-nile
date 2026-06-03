-- ==========================================
-- MASTER DATABASE SETUP FILE
-- Combines Schema, Auth Fixes, RLS Policies, 
-- and Custom RPCs (like Database Usage)
-- ==========================================

-- Enable UUID extension (important for Supabase)
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

----------------------------------------------------
-- 4. Batches
----------------------------------------------------
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

----------------------------------------------------
-- 5. Customers
----------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_debt NUMERIC DEFAULT 0 CHECK (total_debt >= 0),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

----------------------------------------------------
-- 6. Orders
----------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

----------------------------------------------------
-- 7. Order Items
----------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  batch_id UUID REFERENCES batches(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

----------------------------------------------------
-- 8. Sessions (Shifts)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'night')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------
-- 9. User Profiles (Auth Link)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  pharmacy_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------
-- 10. Debt Payments
----------------------------------------------------
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_type TEXT CHECK (payment_type IN ('partial', 'full')) NOT NULL,
  note TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------
-- 11. Audit Logs
----------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

----------------------------------------------------
-- 12. Product Inventory View
----------------------------------------------------
CREATE OR REPLACE VIEW product_inventory AS
SELECT 
  p.id AS product_id,
  p.name,
  COALESCE(SUM(b.quantity), 0) AS total_quantity,
  (
    SELECT b2.selling_price
    FROM batches b2
    WHERE b2.product_id = p.id AND b2.quantity > 0
    ORDER BY b2.expiry_date ASC
    LIMIT 1
  ) AS current_price
FROM products p
LEFT JOIN batches b ON p.id = b.product_id
GROUP BY p.id, p.name;

----------------------------------------------------
-- 13. Enable Row Level Security (RLS)
----------------------------------------------------
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pharmacy_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

----------------------------------------------------
-- 14. Essential Global RLS Policies
----------------------------------------------------
-- For Login Page: Allow anon users to see active pharmacies to populate the dropdown
DROP POLICY IF EXISTS "anon_view_active_pharmacies" ON pharmacies;
CREATE POLICY "anon_view_active_pharmacies" ON pharmacies FOR SELECT TO anon USING (is_active = true);

-- For Logged-in Users: Only see pharmacies they are assigned to
DROP POLICY IF EXISTS "auth_view_own_pharmacies" ON pharmacies;
CREATE POLICY "auth_view_own_pharmacies" ON pharmacies FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_pharmacy_access WHERE pharmacy_id = pharmacies.id AND user_id = auth.uid())
);

-- For Logged-in Users: Only see their own access records
DROP POLICY IF EXISTS "auth_view_own_access" ON user_pharmacy_access;
CREATE POLICY "auth_view_own_access" ON user_pharmacy_access FOR SELECT TO authenticated USING (user_id = auth.uid());

GRANT SELECT ON pharmacies TO anon;
GRANT SELECT ON pharmacies TO authenticated;
GRANT SELECT ON user_pharmacy_access TO authenticated;

----------------------------------------------------
-- 15. Custom DB Usage Size Function
----------------------------------------------------
-- Gets the absolute usage size of the Postgres DB
CREATE OR REPLACE FUNCTION get_db_size() 
RETURNS bigint AS $$
  SELECT pg_database_size('postgres');
$$ LANGUAGE sql SECURITY DEFINER;
