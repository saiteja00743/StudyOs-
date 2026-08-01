/**
 * quizService.ts — Supabase Cloud Storage
 * Quizzes and attempts stored in `quizzes` + `quiz_attempts` tables.
 */
import { Quiz, QuizAttempt, Difficulty } from '@/types/study';
import { rawFrom } from '@/services/supabase';

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
      // Update
      const { data, error } = await rawFrom('quizzes')
        .update({ title: quiz.title, topic: quiz.topic, difficulty: quiz.difficulty,
          time_limit_minutes: quiz.time_limit_minutes, tags: quiz.tags, questions: quiz.questions })
        .eq('id', quiz.id)
        .select()
        .single();
      if (error) { console.error('quizService.save(update):', error.message); return null; }
      return data as Quiz;
    } else {
      // Insert
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

  async generateFromTopic(userId: string, topic: string, difficulty: Difficulty, count: number): Promise<Quiz> {
    // Generates a placeholder quiz — real AI generation handled in PDFPage/ChatPage
    const questions = Array.from({ length: count }, (_, i) => ({
      id: `q-${Date.now()}-${i}`,
      type: 'mcq' as const,
      question: `Question ${i + 1} about ${topic}`,
      options: [
        { id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' }, { id: 'd', text: 'Option D' },
      ],
      correct_answer: 'a',
      difficulty,
    }));
    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: `${topic} Quiz`,
      topic,
      difficulty,
      questions,
      time_limit_minutes: Math.max(5, count),
      created_at: new Date().toISOString(),
      tags: [topic],
    };
    return (await this.save(userId, quiz)) ?? quiz;
  },
};
