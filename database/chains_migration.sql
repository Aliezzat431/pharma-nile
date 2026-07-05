-- ============================================================
-- PHARMANILE CHAINS MIGRATION & CLEANUP
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create Chains Table
CREATE TABLE IF NOT EXISTS chains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  password text, -- Every chain has a password added by its admin in settings
  created_at timestamptz DEFAULT now()
);

-- 2. Add chain_id to Libraries/Entities
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS chain_id uuid REFERENCES chains(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS chain_id uuid REFERENCES chains(id) ON DELETE SET NULL;

-- 3. Cleanup: Delete all pharmacies except 'test'
DELETE FROM pharmacies WHERE name <> 'test';

-- 4. Enable Row Level Security
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;

-- 5. Grant DB Privileges (Resolves REST API Permission Denied [42501] errors)
GRANT ALL PRIVILEGES ON TABLE pharmacies TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE user_profiles TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE user_pharmacy_access TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE chains TO postgres, service_role, anon, authenticated;

-- 6. Re-create detailed RLS Policies on Pharmacies
DROP POLICY IF EXISTS "pharmacies_select_public" ON pharmacies;
DROP POLICY IF EXISTS "Allow public read for active pharmacies" ON pharmacies;
CREATE POLICY "Allow public read for active pharmacies" ON pharmacies
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "pharmacies_insert_anon" ON pharmacies;
DROP POLICY IF EXISTS "Allow anon to create pharmacy" ON pharmacies;
CREATE POLICY "Allow anon to create pharmacy" ON pharmacies
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "pharmacies_update_owner" ON pharmacies;
DROP POLICY IF EXISTS "Allow pharmacy owners to update their record" ON pharmacies;
CREATE POLICY "Allow pharmacy owners to update their record" ON pharmacies
  FOR UPDATE TO authenticated USING (id = (auth.jwt()->'user_metadata'->>'pharmacy_id')::uuid);

-- 7. Chain Admin Policies on Pharmacies
DROP POLICY IF EXISTS "Allow chain admins to view pharmacies in their chain" ON pharmacies;
CREATE POLICY "Allow chain admins to view pharmacies in their chain" ON pharmacies
  FOR SELECT TO authenticated
  USING (
    chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid() AND role = 'chain_admin')
  );

DROP POLICY IF EXISTS "Allow chain admins to insert pharmacies for their chain" ON pharmacies;
CREATE POLICY "Allow chain admins to insert pharmacies for their chain" ON pharmacies
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'chain_admin'
    AND chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Allow chain admins to update pharmacies in their chain" ON pharmacies;
CREATE POLICY "Allow chain admins to update pharmacies in their chain" ON pharmacies
  FOR UPDATE TO authenticated
  USING (
    chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid() AND role = 'chain_admin')
  )
  WITH CHECK (
    chain_id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid() AND role = 'chain_admin')
  );

-- 8. Policies on Chains Table
DROP POLICY IF EXISTS "Allow public select for chains" ON chains;
CREATE POLICY "Allow public select for chains" ON chains
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access on chains" ON chains;
CREATE POLICY "Allow service_role full access on chains" ON chains
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow chain admins to update their own chain" ON chains;
CREATE POLICY "Allow chain admins to update their own chain" ON chains
  FOR UPDATE TO authenticated
  USING (id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid() AND role = 'chain_admin'))
  WITH CHECK (id = (SELECT chain_id FROM user_profiles WHERE id = auth.uid() AND role = 'chain_admin'));

-- 9. Insert a default seed chain and link 'test' pharmacy to it for testing
INSERT INTO chains (name, password)
VALUES ('سلسلة النيل', '123456')
ON CONFLICT (name) DO UPDATE SET password = EXCLUDED.password;

UPDATE pharmacies SET chain_id = (SELECT id FROM chains WHERE name = 'سلسلة النيل' LIMIT 1) WHERE name = 'test';

-- 10. Update Handle User Registration Trigger Function to respect chain_id
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF v_role = 'chain_admin' THEN
    INSERT INTO public.user_profiles (id, pharmacy_id, chain_id, full_name, role)
    VALUES (new.id, null, v_chain_id, v_full_name, v_role)
    ON CONFLICT (id) DO UPDATE SET
      pharmacy_id = null,
      chain_id = EXCLUDED.chain_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  ELSIF v_pharmacy_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.pharmacies WHERE id = v_pharmacy_id) THEN
    IF v_chain_id IS NULL THEN
      SELECT chain_id INTO v_chain_id FROM public.pharmacies WHERE id = v_pharmacy_id;
    END IF;

    INSERT INTO public.user_profiles (id, pharmacy_id, chain_id, full_name, role)
    VALUES (new.id, v_pharmacy_id, v_chain_id, v_full_name, v_role)
    ON CONFLICT (id) DO UPDATE SET
      pharmacy_id = EXCLUDED.pharmacy_id,
      chain_id = EXCLUDED.chain_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

    INSERT INTO public.user_pharmacy_access (user_id, pharmacy_id, role, is_primary)
    VALUES (new.id, v_pharmacy_id, v_role, true)
    ON CONFLICT (user_id, pharmacy_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;


