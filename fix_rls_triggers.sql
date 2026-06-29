-- ============================================================
-- PharmaEgypt Premium OS: RLS Hardening & Auth Triggers
-- Run this in your Supabase SQL Editor to secure signup/registration.
-- ============================================================

-- 1. Create/Overwrite Auth Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with high database privileges (needed for writing to public schemas)
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_role text;
  v_pharmacy_id uuid;
BEGIN
  -- Extract metadata provided during Supabase auth.signUp()
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'صيدلي نيل جديد');
  v_role      := COALESCE(new.raw_user_meta_data->>'role', 'staff');
  v_pharmacy_id := (new.raw_user_meta_data->>'pharmacy_id')::uuid;

  -- Verify pharmacy exists before proceeding
  IF v_pharmacy_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.pharmacies WHERE id = v_pharmacy_id) THEN
    
    -- Insert user profile
    INSERT INTO public.user_profiles (id, pharmacy_id, full_name, role)
    VALUES (new.id, v_pharmacy_id, v_full_name, v_role)
    ON CONFLICT (id) DO UPDATE SET
      pharmacy_id = EXCLUDED.pharmacy_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

    -- Insert primary access mapping
    INSERT INTO public.user_pharmacy_access (user_id, pharmacy_id, role, is_primary)
    VALUES (new.id, v_pharmacy_id, v_role, true)
    ON CONFLICT (user_id, pharmacy_id) DO NOTHING;

  END IF;

  RETURN new;
END;
$$;

-- 2. Bind trigger to auth.users table
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- 3. Lock Down RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Delete the loose anon insert policy
DROP POLICY IF EXISTS "Allow user to insert their own profile" ON public.user_profiles;

-- Create highly targeted policies
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.user_profiles;
CREATE POLICY "Allow users to view their own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Allow managers to view profiles in their pharmacy" ON public.user_profiles;
CREATE POLICY "Allow managers to view profiles in their pharmacy"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    pharmacy_id = (auth.jwt()->'user_metadata'->>'pharmacy_id')::uuid 
    AND (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'manager')
  );

-- 4. Lock Down RLS on user_pharmacy_access
ALTER TABLE public.user_pharmacy_access ENABLE ROW LEVEL SECURITY;

-- Delete the loose anon insert policy
DROP POLICY IF EXISTS "Allow user to insert their own access" ON public.user_pharmacy_access;

-- Create secure select policy
DROP POLICY IF EXISTS "Allow user to view their own access" ON public.user_pharmacy_access;
CREATE POLICY "Allow user to view their own access"
  ON public.user_pharmacy_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
