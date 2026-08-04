// ─── Type Definitions for StudyOS AI ─────────────────────

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  folder_id?: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'txt';
  size: number;
  url: string;
  summary?: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  source: 'pdf' | 'notes' | 'topic';
  source_id?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short_answer' | 'coding';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review: string;
  streak: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  duration_minutes: number;
  subject?: string;
  session_type: 'pomodoro' | 'free' | 'quiz' | 'review';
  created_at: string;
}

export interface Analytics {
  study_hours_today: number;
  study_hours_week: number;
  quiz_avg_score: number;
  current_streak: number;
  notes_count: number;
  flashcards_reviewed: number;
  weak_topics: string[];
  strong_topics: string[];
}

export type Theme = 'dark' | 'light' | 'system';
export type Language = 'en' | 'hi' | 'es' | 'fr' | 'pt';

export type NotificationType = 'streak' | 'quiz' | 'planner' | 'notes' | 'system' | 'achievement';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface StreakDay {
  dayName: string; // e.g. 'Mon'
  dateStr: string; // 'YYYY-MM-DD'
  isToday: boolean;
  completed: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
  streakFreezes: number;
  weeklyHistory: StreakDay[];
}

