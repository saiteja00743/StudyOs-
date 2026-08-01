-- ============================================================================
-- StudyOS AI — Complete Production Database Schema for Supabase (PostgreSQL)
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
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
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT FALSE,
  is_ai_enhanced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes."
  ON public.notes FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_folder_idx ON public.notes(folder);

-- ----------------------------------------------------------------------------
-- PDF DOCUMENTS TABLE (PDF Intelligence & Summaries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  size BIGINT DEFAULT 0,
  page_count INTEGER,
  status TEXT DEFAULT 'ready', -- 'uploading', 'processing', 'ready', 'error'
  summary TEXT,
  key_points TEXT[],
  file_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can manage their own chat sessions."
  ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat messages."
  ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON public.chat_messages(session_id);

-- ----------------------------------------------------------------------------
-- QUIZZES & QUIZ ATTEMPTS TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
  time_limit_minutes INTEGER DEFAULT 10,
  tags TEXT[] DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quizzes."
  ON public.quizzes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz attempts."
  ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- FLASHCARDS TABLE (Spaced Repetition System)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck TEXT NOT NULL DEFAULT 'General',
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  difficulty TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new', -- 'new' | 'learning' | 'review' | 'mastered'
  tags TEXT[] DEFAULT '{}',
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  ease_factor NUMERIC(4, 2) DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flashcards."
  ON public.flashcards FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS flashcards_user_deck_idx ON public.flashcards(user_id, deck);

-- ----------------------------------------------------------------------------
-- PLANNER TASKS TABLE (Kanban & Pomodoro Tracker)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  status TEXT DEFAULT 'todo', -- 'todo' | 'in_progress' | 'done'
  due_date DATE DEFAULT CURRENT_DATE,
  estimated_minutes INTEGER DEFAULT 30,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own planner tasks."
  ON public.planner_tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS planner_tasks_user_status_idx ON public.planner_tasks(user_id, status);
