-- ============================================================
-- Fix: Allow admins to read ALL profiles (RLS bypass)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Create a SECURITY DEFINER function to check admin role
-- (SECURITY DEFINER bypasses RLS, preventing infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 2: Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 3: Drop any existing SELECT policy on profiles that might conflict
-- (Run this only if you have an existing policy — check Supabase > Auth > Policies)
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Step 4: Create new policy — own profile OR admin sees all
CREATE POLICY "Profiles: own or admin can read"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- ✅ After running this, refresh the admin dashboard
-- You should now see all 5 users in the Users tab
