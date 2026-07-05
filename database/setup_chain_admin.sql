-- ============================================================
-- PHARMANILE — CHAIN ADMIN SETUP SCRIPT
-- Sets up test.nay55@gmail.com as chain_admin with one branch
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Ensure chains table has owner_id column
-- ─────────────────────────────────────────────────────────────
ALTER TABLE chains ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE chains ADD COLUMN IF NOT EXISTS owner_email text;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Ensure user_profiles & pharmacies have chain_id
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS chain_id uuid REFERENCES chains(id) ON DELETE SET NULL;
ALTER TABLE pharmacies    ADD COLUMN IF NOT EXISTS chain_id uuid REFERENCES chains(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Create chain + link to test.nay55@gmail.com
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id      uuid;
  v_chain_id     uuid;
  v_pharmacy_id  uuid;
BEGIN

  -- Get the user ID of test.nay55@gmail.com from Supabase Auth
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test.nay55@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User test.nay55@gmail.com not found in auth.users — create the Supabase account first.';
  END IF;

  -- Create the chain (or get existing)
  INSERT INTO chains (name, owner_id, owner_email)
  VALUES ('صيدليات دكتور محمد', v_user_id, 'test.nay55@gmail.com')
  ON CONFLICT (name) DO UPDATE
    SET owner_id    = EXCLUDED.owner_id,
        owner_email = EXCLUDED.owner_email
  RETURNING id INTO v_chain_id;

  -- If chain already existed, just fetch its id
  IF v_chain_id IS NULL THEN
    SELECT id INTO v_chain_id FROM chains WHERE name = 'سلسلة نيل الرئيسية';
  END IF;

  -- Create / reuse the first pharmacy branch
  INSERT INTO pharmacies (name, address, phone, is_active, chain_id)
  VALUES ('الفرع الرئيسي', NULL, NULL, true, v_chain_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_pharmacy_id;

  -- If already existed, fetch it
  IF v_pharmacy_id IS NULL THEN
    SELECT id INTO v_pharmacy_id
    FROM pharmacies WHERE chain_id = v_chain_id
    ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Upsert user_profile as chain_admin
  INSERT INTO user_profiles (id, pharmacy_id, chain_id, full_name, role)
  VALUES (v_user_id, v_pharmacy_id, v_chain_id, 'مدير السلسلة', 'admin')
  ON CONFLICT (id) DO UPDATE
    SET pharmacy_id = v_pharmacy_id,
        chain_id    = v_chain_id,
        role        = 'admin';

  -- Grant this admin access to their first pharmacy
  INSERT INTO user_pharmacy_access (user_id, pharmacy_id, role, is_primary)
  VALUES (v_user_id, v_pharmacy_id, 'admin', true)
  ON CONFLICT (user_id, pharmacy_id) DO UPDATE
    SET role       = 'admin',
        is_primary = true;

  -- Stamp JWT metadata so middleware sees the correct role immediately at next login
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
        'role',        'admin',
        'chain_id',    v_chain_id::text,
        'pharmacy_id', v_pharmacy_id::text,
        'full_name',   'مدير السلسلة'
      )
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Done! chain_id=%, pharmacy_id=%, user_id=%', v_chain_id, v_pharmacy_id, v_user_id;

END $$;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: RLS — chain admins can manage their chain's pharmacies
-- ─────────────────────────────────────────────────────────────

-- Allow chain admins to select all pharmacies in their chain
DROP POLICY IF EXISTS "chain_admin_select_pharmacies" ON pharmacies;
CREATE POLICY "chain_admin_select_pharmacies" ON pharmacies
  FOR SELECT TO authenticated
  USING (
    chain_id = (
      SELECT chain_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR is_active = true   -- anon / staff still see active list for login
  );

-- Allow chain admins to insert new branches in their chain
DROP POLICY IF EXISTS "chain_admin_insert_pharmacies" ON pharmacies;
CREATE POLICY "chain_admin_insert_pharmacies" ON pharmacies
  FOR INSERT TO authenticated
  WITH CHECK (
    chain_id = (
      SELECT chain_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow chain admins to update pharmacies in their chain
DROP POLICY IF EXISTS "chain_admin_update_pharmacies" ON pharmacies;
CREATE POLICY "chain_admin_update_pharmacies" ON pharmacies
  FOR UPDATE TO authenticated
  USING (
    chain_id = (
      SELECT chain_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Employees can read pharmacies in their chain (for branch switching)
DROP POLICY IF EXISTS "employee_read_chain_pharmacies" ON pharmacies;
CREATE POLICY "employee_read_chain_pharmacies" ON pharmacies
  FOR SELECT TO authenticated
  USING (
    chain_id = (
      SELECT chain_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Allow employees to switch pharmacy (update user_pharmacy_access)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "employee_insert_own_access" ON user_pharmacy_access;
CREATE POLICY "employee_insert_own_access" ON user_pharmacy_access
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "employee_update_own_access" ON user_pharmacy_access;
CREATE POLICY "employee_update_own_access" ON user_pharmacy_access
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Chains RLS — owner can update their chain settings
-- ─────────────────────────────────────────────────────────────
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chains_public_select" ON chains;
CREATE POLICY "chains_public_select" ON chains
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chains_owner_update" ON chains;
CREATE POLICY "chains_owner_update" ON chains
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "chains_owner_insert" ON chains;
CREATE POLICY "chains_owner_insert" ON chains
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- STEP 7: Grants
-- ─────────────────────────────────────────────────────────────
GRANT ALL ON TABLE chains TO authenticated;
GRANT SELECT ON TABLE chains TO anon;
GRANT ALL ON TABLE pharmacies TO authenticated;
GRANT SELECT ON TABLE pharmacies TO anon;
GRANT ALL ON TABLE user_pharmacy_access TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- DONE ✅
-- ─────────────────────────────────────────────────────────────
