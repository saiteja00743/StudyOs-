-- ============================================================================
-- StudyOS AI — Safe Migration: Add Missing Columns to Existing Tables
-- Run this in Supabase Dashboard → SQL Editor → Run ▶️
-- Uses IF NOT EXISTS — completely safe to run on existing data, nothing is dropped.
-- ============================================================================

-- 1. notes table — add word_count (used by notesService for display)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- 2. quiz_attempts table — add answers JSONB (stores per-question responses)
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;

-- 3. planner_tasks table — add description, actual_minutes, tags
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS description   TEXT    DEFAULT '';
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS tags           TEXT[]  DEFAULT '{}';

-- ============================================================================
-- Verify — uncomment and run to confirm all columns exist:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'planner_tasks'
-- ORDER BY ordinal_position;
-- ============================================================================
