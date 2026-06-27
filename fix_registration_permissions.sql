-- ==========================================
-- Fix Permissions for Pharmacies Table
-- ==========================================

-- 1. Enable RLS (just in case)
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public to view ACTIVE pharmacies (Required for Login/Register pages)
DROP POLICY IF EXISTS "Allow public read for active pharmacies" ON pharmacies;
CREATE POLICY "Allow public read for active pharmacies"
ON pharmacies FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 3. Allow Public to create a new pharmacy (Required for Registration)
DROP POLICY IF EXISTS "Allow anon to create pharmacy" ON pharmacies;
CREATE POLICY "Allow anon to create pharmacy"
ON pharmacies FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Allow Pharmacies to Update their own record
DROP POLICY IF EXISTS "Allow pharmacy owners to update their record" ON pharmacies;
CREATE POLICY "Allow pharmacy owners to update their record"
ON pharmacies FOR UPDATE
TO authenticated
USING (id = (auth.jwt()->'user_metadata'->>'pharmacy_id')::uuid);

-- ==========================================
-- Fix Permissions for user_profiles (Required for Registration)
-- ==========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user to insert their own profile" ON user_profiles;
CREATE POLICY "Allow user to insert their own profile"
ON user_profiles FOR INSERT
TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to view their own profile" ON user_profiles;
CREATE POLICY "Allow users to view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- ==========================================
-- Fix Permissions for user_pharmacy_access (Required for Registration)
-- ==========================================
-- Ensure table exists first (if missing from previous migrations)
CREATE TABLE IF NOT EXISTS user_pharmacy_access (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  role text DEFAULT 'staff',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pharmacy_id)
);

ALTER TABLE user_pharmacy_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user to insert their own access" ON user_pharmacy_access;
CREATE POLICY "Allow user to insert their own access"
ON user_pharmacy_access FOR INSERT
TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user to view their own access" ON user_pharmacy_access;
CREATE POLICY "Allow user to view their own access"
ON user_pharmacy_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());
