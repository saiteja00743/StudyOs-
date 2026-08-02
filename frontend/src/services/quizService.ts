/**
 * quizService.ts — Supabase Cloud Storage + Real AI Generation
 * Quizzes and attempts stored in `quizzes` + `quiz_attempts` tables.
 * AI quiz generation via backend /api/chat endpoint.
 */
import { Quiz, QuizAttempt, Difficulty } from '@/types/study';
import { rawFrom } from '@/services/supabase';

async function generateQuestionsWithAI(
  topic: string,
  difficulty: Difficulty,
  count: number
): Promise<Quiz['questions']> {
  const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.

CRITICAL: Respond ONLY with a valid JSON array. No explanation, no markdown, just the JSON array.

Required format:
[
  {
    "question": "Question text here?",
    "options": [
      {"id": "a", "text": "Option A text"},
      {"id": "b", "text": "Option B text"},
      {"id": "c", "text": "Option C text"},
      {"id": "d", "text": "Option D text"}
    ],
    "correct_answer": "a",
    "explanation": "Why this answer is correct.",
    "difficulty": "${difficulty}"
  }
]

Generate ${count} questions now:`;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        subject_focus: 'exam_prep',
        session_id: `quiz-gen-${Date.now()}`,
        history: [],
      }),
    });

    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    const raw: string = data.content || '';

    // Strip markdown fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      cleaned = lines.slice(1, -1).join('\n').trim();
    }

    // Find first [ and last ]
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array in response');

    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return parsed.map((q: Record<string, unknown>, i: number) => ({
      id: `q-${Date.now()}-${i}`,
      type: 'mcq' as const,
      question: String(q.question || ''),
      options: (q.options as { id: string; text: string }[]) || [
        { id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' }, { id: 'd', text: 'Option D' },
      ],
      correct_answer: String(q.correct_answer || 'a'),
      explanation: String(q.explanation || ''),
      difficulty: (q.difficulty as Difficulty) || difficulty,
    }));
  } catch (e) {
    console.error('AI quiz generation failed, using fallback:', e);
    // Fallback to meaningful placeholder questions
    return Array.from({ length: count }, (_, i) => ({
      id: `q-${Date.now()}-${i}`,
      type: 'mcq' as const,
      question: `What is a key concept in ${topic}? (Question ${i + 1})`,
      options: [
        { id: 'a', text: 'Fundamental principles and core theory' },
        { id: 'b', text: 'Historical context and background' },
        { id: 'c', text: 'Practical applications and use cases' },
        { id: 'd', text: 'Common misconceptions and pitfalls' },
      ],
      correct_answer: 'a',
      explanation: `Understanding the fundamental principles of ${topic} is essential for mastery.`,
      difficulty,
    }));
  }
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
