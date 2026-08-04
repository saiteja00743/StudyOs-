/**
 * quizService.ts — Supabase Cloud Storage + Real AI Generation
 * Quizzes and attempts stored in `quizzes` + `quiz_attempts` tables.
 * AI quiz generation via backend /api/chat endpoint.
 */
import { Quiz, QuizAttempt, Difficulty } from '@/types/study';
import { rawFrom } from '@/services/supabase';

// Production: VITE_API_URL = https://studyos-i60n.onrender.com
// Local dev:  empty string → Vite proxy forwards /api → localhost:8000
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '')
  .replace(/\/api\/?$/, '')  // strip trailing /api if already included
  .replace(/\/$/, '');
const QUIZ_GENERATE_URL = `${API_BASE}/api/quiz/generate`;

async function generateQuestionsWithAI(
  topic: string,
  difficulty: Difficulty,
  count: number
): Promise<Quiz['questions']> {
  // Retry up to 2 times on transient network errors
  const MAX_RETRIES = 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(QUIZ_GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, count }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(errBody.detail || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Backend returned empty or invalid questions array');
      }

      // Stamp IDs and enforce types
      return data.questions.map((q: Record<string, unknown>, i: number) => ({
        id: `q-${Date.now()}-${i}`,
        type: 'mcq' as const,
        question: String(q.question || ''),
        options: (q.options as { id: string; text: string }[]) || [],
        correct_answer: String(q.correct_answer || 'a'),
        explanation: String(q.explanation || ''),
        difficulty: (q.difficulty as Difficulty) || difficulty,
      }));

    } catch (e) {
      lastError = e;
      if (attempt < MAX_RETRIES) {
        // Wait briefly before retry
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
    }
  }

  // All retries exhausted — throw so the UI can show a real error
  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : 'Quiz generation failed. Please check your backend connection and try again.'
  );
}


export const quizService = {
  async getAll(userId: string): Promise<Quiz[]> {
    const { data, error } = await rawFrom('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('quizService.getAll:', error.message); return []; }
    return (data as Quiz[]) ?? [];
  },

  async getById(userId: string, id: string): Promise<Quiz | null> {
    const { data, error } = await rawFrom('quizzes')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Quiz;
  },

  async save(userId: string, quiz: Quiz): Promise<Quiz | null> {
    const existing = await this.getById(userId, quiz.id);
    if (existing) {
      const { data, error } = await rawFrom('quizzes')
        .update({ title: quiz.title, topic: quiz.topic, difficulty: quiz.difficulty,
          time_limit_minutes: quiz.time_limit_minutes, tags: quiz.tags, questions: quiz.questions })
        .eq('id', quiz.id)
        .select()
        .single();
      if (error) { console.error('quizService.save(update):', error.message); return null; }
      return data as Quiz;
    } else {
      const payload = {
        user_id: userId,
        title: quiz.title,
        topic: quiz.topic || '',
        difficulty: quiz.difficulty || 'medium',
        time_limit_minutes: quiz.time_limit_minutes || 10,
        tags: quiz.tags || [],
        questions: quiz.questions || [],
        created_at: new Date().toISOString(),
      };
      const { data, error } = await rawFrom('quizzes').insert(payload).select().single();
      if (error) { console.error('quizService.save(insert):', error.message); return null; }
      return data as Quiz;
    }
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await rawFrom('quizzes').delete().eq('id', id);
    if (error) { console.error('quizService.delete:', error.message); return false; }
    return true;
  },

  async saveAttempt(userId: string, attempt: QuizAttempt): Promise<boolean> {
    const payload = {
      quiz_id: attempt.quiz_id,
      user_id: userId,
      score: attempt.score,
      total_questions: attempt.total,
      time_spent_seconds: attempt.time_taken_seconds,
      answers: attempt.answers || {},
      completed_at: attempt.completed_at || new Date().toISOString(),
    };
    const { error } = await rawFrom('quiz_attempts').insert(payload);
    if (error) { console.error('quizService.saveAttempt:', error.message); return false; }
    return true;
  },

  async getAttempts(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await rawFrom('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(50);
    if (error) { console.error('quizService.getAttempts:', error.message); return []; }
    return (data ?? []).map((a: Record<string, unknown>) => ({
      quiz_id: a.quiz_id as string,
      answers: (a.answers as Record<string, string>) || {},
      score: a.score as number,
      total: a.total_questions as number,
      time_taken_seconds: a.time_spent_seconds as number,
      completed_at: a.completed_at as string,
    }));
  },

  /**
   * Generate a real AI quiz via backend Gemini proxy.
   * Falls back to placeholder questions if AI is unavailable.
   */
  async generateFromTopic(userId: string, topic: string, difficulty: Difficulty, count: number): Promise<Quiz> {
    const questions = await generateQuestionsWithAI(topic, difficulty, count);
    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: `${topic} — AI Quiz`,
      topic,
      difficulty,
      questions,
      time_limit_minutes: Math.max(5, count * 1.5),
      created_at: new Date().toISOString(),
      tags: [topic],
    };
    return (await this.save(userId, quiz)) ?? quiz;
  },
};
