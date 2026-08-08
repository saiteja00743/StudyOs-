-- Migration: Add role column to profiles for admin access control
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Create an index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- IMPORTANT: After running this migration, set your own account to admin:
-- UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
-- Or by email:
-- UPDATE public.profiles SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com');

COMMENT ON COLUMN public.profiles.role IS 'User role: user (default) or admin';
