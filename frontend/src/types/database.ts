// Supabase Database Type Definitions for StudyOS AI Platform
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          bio: string | null;
          school: string | null;
          avatar_url: string | null;
          study_streak: number;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          bio?: string | null;
          school?: string | null;
          avatar_url?: string | null;
          study_streak?: number;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          bio?: string | null;
          school?: string | null;
          avatar_url?: string | null;
          study_streak?: number;
          role?: 'user' | 'admin';
          updated_at?: string;
        };
      };

      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          folder: string;
          tags: string[];
          is_starred: boolean;
          is_ai_enhanced: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          folder?: string;
          tags?: string[];
          is_starred?: boolean;
          is_ai_enhanced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          folder?: string;
          tags?: string[];
          is_starred?: boolean;
          is_ai_enhanced?: boolean;
          updated_at?: string;
        };
      };

      pdf_documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          size: number;
          page_count: number | null;
          status: 'uploading' | 'processing' | 'ready' | 'error';
          summary: string | null;
          key_points: string[] | null;
          file_url: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          size?: number;
          page_count?: number | null;
          status?: 'uploading' | 'processing' | 'ready' | 'error';
          summary?: string | null;
          key_points?: string[] | null;
          file_url?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          size?: number;
          page_count?: number | null;
          status?: 'uploading' | 'processing' | 'ready' | 'error';
          summary?: string | null;
          key_points?: string[] | null;
          file_url?: string | null;
        };
      };

      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subject_focus: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          subject_focus?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subject_focus?: string;
          updated_at?: string;
        };
      };

      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: 'user' | 'assistant';
          content?: string;
        };
      };

      quizzes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic: string;
          difficulty: 'easy' | 'medium' | 'hard';
          time_limit_minutes: number;
          tags: string[];
          questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          topic: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          time_limit_minutes?: number;
          tags?: string[];
          questions?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          topic?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          time_limit_minutes?: number;
          tags?: string[];
          questions?: Json;
        };
      };

      flashcards: {
        Row: {
          id: string;
          user_id: string;
          deck: string;
          front: string;
          back: string;
          hint: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          status: 'new' | 'learning' | 'review' | 'mastered';
          tags: string[];
          next_review_at: string;
          review_count: number;
          ease_factor: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          deck?: string;
          front: string;
          back: string;
          hint?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          status?: 'new' | 'learning' | 'review' | 'mastered';
          tags?: string[];
          next_review_at?: string;
          review_count?: number;
          ease_factor?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          deck?: string;
          front?: string;
          back?: string;
          hint?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          status?: 'new' | 'learning' | 'review' | 'mastered';
          tags?: string[];
          next_review_at?: string;
          review_count?: number;
          ease_factor?: number;
        };
      };

      planner_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subject: string;
          priority: 'low' | 'medium' | 'high';
          status: 'todo' | 'in_progress' | 'done';
          due_date: string;
          estimated_minutes: number;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subject?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'todo' | 'in_progress' | 'done';
          due_date?: string;
          estimated_minutes?: number;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subject?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'todo' | 'in_progress' | 'done';
          due_date?: string;
          estimated_minutes?: number;
          completed_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
