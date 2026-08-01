export type QuestionType = 'mcq' | 'short_answer' | 'true_false';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: QuizOption[];
  correct_answer: string;
  explanation?: string;
  difficulty: Difficulty;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  time_limit_minutes: number;
  created_at: string;
  tags: string[];
}

export interface QuizAttempt {
  quiz_id: string;
  answers: Record<string, string>; // question_id -> answer
  score: number;
  total: number;
  time_taken_seconds: number;
  completed_at: string;
}

// ─── Flashcards ────────────────────────────────────────────────
export type FlashcardStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: Difficulty;
  status: FlashcardStatus;
  deck: string;
  tags: string[];
  next_review_at: string;
  review_count: number;
  ease_factor: number;
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  color: string;
  card_count: number;
  mastered_count: number;
  created_at: string;
}

// ─── Planner ──────────────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface PlannerTask {
  id: string;
  title: string;
  description?: string;
  subject: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  estimated_minutes: number;
  actual_minutes?: number;
  tags: string[];
  created_at: string;
}

export interface PomodoroSession {
  task_id?: string;
  duration_minutes: number;
  completed: boolean;
  started_at: string;
}
