-- Supabase PostgreSQL Schema for Pharmacy Stock Management System

-- 1. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_conversion NUMERIC DEFAULT 1,
  company TEXT NOT NULL,
  inventory_method TEXT CHECK (inventory_method IN ('FEFO', 'FIFO', 'LIFO')) DEFAULT 'FEFO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Batches Table
CREATE TABLE batches (
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

-- 3. Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debtor_id UUID, -- Optional array link to users if debtor
  total NUMERIC NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL
);

-- 5. Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  username TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  shift_type TEXT CHECK (shift_type IN ('morning', 'night')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Users Profile Extension (assuming Supabase Auth is used)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  pharmacy_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Computed Views / RPCs (Examples)
CREATE VIEW product_inventory AS
SELECT 
  p.id AS product_id,
  SUM(b.quantity) AS total_quantity,
  (SELECT selling_price FROM batches b2 WHERE b2.product_id = p.id AND b2.quantity > 0 ORDER BY expiry_date ASC LIMIT 1) AS current_price
FROM products p
LEFT JOIN batches b ON p.id = b.product_id
GROUP BY p.id;
