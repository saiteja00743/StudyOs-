export type NoteFolder = 'all' | 'starred' | 'ai-enhanced' | string;

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  is_starred: boolean;
  is_ai_enhanced: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface NoteFolder_ {
  id: string;
  name: string;
  color: string;
  icon: string;
  note_count: number;
}

export type PDFStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  page_count?: number;
  summary?: string;
  key_points?: string[];
  status: PDFStatus;
  uploaded_at: string;
  user_id?: string;
}

export interface PDFProcessResult {
  summary: string;
  key_points: string[];
  suggested_quiz_topics: string[];
}
