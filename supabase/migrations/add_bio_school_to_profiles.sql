-- ============================================================================
-- Migration: Add bio and school fields to profiles table
-- Run this in Supabase Dashboard → SQL Editor if you already have the schema set up.
-- ============================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS school TEXT DEFAULT '';

-- Also allow updates to these new columns via RLS
-- (Your existing UPDATE policy already covers all columns, so no change needed.)
