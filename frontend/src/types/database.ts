// Supabase Database type definitions
// Replace with generated types from: supabase gen types typescript --project-id YOUR_ID
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
          avatar_url: string | null;
          study_streak: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          study_streak?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          study_streak?: number;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_completed: boolean;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          is_completed?: boolean;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          is_completed?: boolean;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          folder_id: string | null;
          tags: string[];
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          folder_id?: string | null;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          folder_id?: string | null;
          tags?: string[];
          is_pinned?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
