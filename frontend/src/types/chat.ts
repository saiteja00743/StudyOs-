export type SubjectFocus = 'general' | 'math_science' | 'coding' | 'humanities' | 'exam_prep';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  subject_focus?: SubjectFocus;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[]; // Optional — loaded separately from Supabase
  subject_focus: SubjectFocus;
}

export interface SuggestedQuestion {
  id: string;
  category: string;
  question: string;
  prompt: string;
  icon: string;
}

export interface SubjectOption {
  id: SubjectFocus;
  label: string;
  description: string;
  icon: string;
  gradient: string;
}
