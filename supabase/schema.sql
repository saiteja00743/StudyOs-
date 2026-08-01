-- ============================================================================
-- StudyOS AI — Complete Production Database Schema for Supabase (PostgreSQL)
-- Run this ENTIRE file in Supabase Dashboard → SQL Editor → Run
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE / IF NOT EXISTS columns
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- PROFILES TABLE (Extends Supabase Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  bio TEXT DEFAULT '',
  school TEXT DEFAULT '',
  avatar_url TEXT,
  study_streak INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns safely if re-running
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT DEFAULT '';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, bio, school)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- NOTES TABLE (Smart Notes & Rich Text Editor)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  folder TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT FALSE,
  is_ai_enhanced BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notes." ON public.notes;
CREATE POLICY "Users can manage their own notes."
  ON public.notes FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_folder_idx ON public.notes(folder);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON public.notes(updated_at DESC);

-- ----------------------------------------------------------------------------
-- PDF DOCUMENTS TABLE (PDF Intelligence & Summaries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  size BIGINT DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ready',
  summary TEXT DEFAULT '',
  key_points TEXT[] DEFAULT '{}',
  file_url TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own pdf documents." ON public.pdf_documents;
CREATE POLICY "Users can manage their own pdf documents."
  ON public.pdf_documents FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pdf_user_id_idx ON public.pdf_documents(user_id);

-- ----------------------------------------------------------------------------
-- AI CHAT SESSIONS & MESSAGES TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled Chat',
  subject_focus TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chat sessions." ON public.chat_sessions;
CREATE POLICY "Users can manage their own chat sessions."
  ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chat messages." ON public.chat_messages;
CREATE POLICY "Users can manage their own chat messages."
  ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_sessions_user_idx ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON public.chat_messages(session_id);

-- ----------------------------------------------------------------------------
-- QUIZZES & QUIZ ATTEMPTS TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit_minutes INTEGER DEFAULT 10,
  tags TEXT[] DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own quizzes." ON public.quizzes;
CREATE POLICY "Users can manage their own quizzes."
  ON public.quizzes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own quiz attempts." ON public.quiz_attempts;
CREATE POLICY "Users can manage their own quiz attempts."
  ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS quizzes_user_idx ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON public.quiz_attempts(user_id);

-- ----------------------------------------------------------------------------
-- FLASHCARDS TABLE (Spaced Repetition System)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck TEXT NOT NULL DEFAULT 'General',
  front TEXT NOT NULL DEFAULT '',
  back TEXT NOT NULL DEFAULT '',
  hint TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
  tags TEXT[] DEFAULT '{}',
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  ease_factor NUMERIC(4, 2) DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own flashcards." ON public.flashcards;
CREATE POLICY "Users can manage their own flashcards."
  ON public.flashcards FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS flashcards_user_deck_idx ON public.flashcards(user_id, deck);
CREATE INDEX IF NOT EXISTS flashcards_review_idx ON public.flashcards(user_id, next_review_at);

-- ----------------------------------------------------------------------------
-- PLANNER TASKS TABLE (Kanban & Pomodoro Tracker)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Task',
  description TEXT DEFAULT '',
  subject TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date DATE DEFAULT CURRENT_DATE,
  estimated_minutes INTEGER DEFAULT 30,
  actual_minutes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0;
ALTER TABLE public.planner_tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own planner tasks." ON public.planner_tasks;
CREATE POLICY "Users can manage their own planner tasks."
  ON public.planner_tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS planner_tasks_user_status_idx ON public.planner_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS planner_tasks_due_date_idx ON public.planner_tasks(user_id, due_date);
