-- Enable UUID extension (important for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1. Companies
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
-- 2. Products
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
-- 3. Batches
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
-- 4. Customers
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
-- 5. Orders
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
-- 6. Order Items
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
-- 7. Sessions (Shifts)
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
-- 8. User Profiles
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
-- 9. Debt Payments
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
-- 10. Audit Logs
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
-- 11. Product Inventory View
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