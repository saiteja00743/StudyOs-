/**
 * flashcardService.ts — Supabase Cloud Storage
 * All flashcards stored in the `flashcards` table, scoped to user via RLS.
 */
import { Flashcard, FlashcardDeck, FlashcardStatus } from '@/types/study';
import { rawFrom } from '@/services/supabase';

export const flashcardService = {
  async getAll(userId: string): Promise<Flashcard[]> {
    const { data, error } = await rawFrom('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('flashcardService.getAll:', error.message); return []; }
    return (data as Flashcard[]) ?? [];
  },

  async getDecks(userId: string): Promise<FlashcardDeck[]> {
    const cards = await this.getAll(userId);
    const deckMap: Record<string, FlashcardDeck> = {};
    cards.forEach((c) => {
      if (!deckMap[c.deck]) {
        deckMap[c.deck] = {
          id: `deck-${c.deck}`,
          name: c.deck,
          description: '',
          color: '#6d4bff',
          card_count: 0,
          mastered_count: 0,
          created_at: c.created_at,
        };
      }
      deckMap[c.deck].card_count++;
      if (c.status === 'mastered') deckMap[c.deck].mastered_count++;
    });
    return Object.values(deckMap);
  },

  async getDueCards(userId: string): Promise<Flashcard[]> {
    const { data, error } = await rawFrom('flashcards')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'mastered')
      .lte('next_review_at', new Date().toISOString());
    if (error) { console.error('flashcardService.getDueCards:', error.message); return []; }
    return (data as Flashcard[]) ?? [];
  },

  async create(userId: string, data: Partial<Flashcard>): Promise<Flashcard | null> {
    const payload = {
      user_id: userId,
      front: data.front || '',
      back: data.back || '',
      hint: data.hint || '',
      difficulty: data.difficulty || 'medium',
      status: 'new',
      deck: data.deck || 'General',
      tags: data.tags || [],
      next_review_at: new Date().toISOString(),
      review_count: 0,
      ease_factor: 2.5,
      created_at: new Date().toISOString(),
    };
    const { data: created, error } = await rawFrom('flashcards').insert(payload).select().single();
    if (error) { console.error('flashcardService.create:', error.message); return null; }
    return created as Flashcard;
  },

  async update(id: string, data: Partial<Flashcard>): Promise<Flashcard | null> {
    const { data: updated, error } = await rawFrom('flashcards')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('flashcardService.update:', error.message); return null; }
    return updated as Flashcard;
  },

  async review(id: string, rating: 1 | 2 | 3 | 4, card: Flashcard): Promise<Flashcard | null> {
    // SM-2 spaced repetition algorithm
    let ef = card.ease_factor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
    ef = Math.max(1.3, ef);
    const intervals = [1, 3, 7, 14, 30];
    const interval = rating >= 3 ? intervals[Math.min(card.review_count, intervals.length - 1)] : 1;
    const nextReview = new Date(Date.now() + interval * 86400000);
    const status: FlashcardStatus =
      rating >= 4 && card.review_count >= 4 ? 'mastered'
      : rating >= 3 ? 'review'
      : 'learning';

    return this.update(id, {
      ease_factor: ef,
      review_count: card.review_count + 1,
      next_review_at: nextReview.toISOString(),
      status,
    });
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await rawFrom('flashcards').delete().eq('id', id);
    if (error) { console.error('flashcardService.delete:', error.message); return false; }
    return true;
  },

  /**
   * Generate real AI flashcards from a topic using the backend Gemini proxy.
   */
  async generateFromTopic(
    userId: string,
    topic: string,
    count: number = 8,
    deck?: string
  ): Promise<Flashcard[]> {
    const prompt = `Create ${count} study flashcards about "${topic}".

CRITICAL: Respond ONLY with a valid JSON array. No markdown, no explanation.

Format:
[
  {
    "front": "Question or concept on the front of the card",
    "back": "Clear, concise answer or explanation",
    "hint": "Optional short hint"
  }
]

Generate ${count} high-quality flashcards now:`;

    let pairs: { front: string; back: string; hint?: string }[] = [];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          subject_focus: 'exam_prep',
          session_id: `fc-gen-${Date.now()}`,
          history: [],
        }),
      });
      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data = await res.json();
      let raw: string = (data.content || '').trim();
      if (raw.startsWith('```')) {
        raw = raw.split('\n').slice(1, -1).join('\n').trim();
      }
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        pairs = JSON.parse(raw.slice(start, end + 1));
      }
    } catch (e) {
      console.error('AI flashcard generation failed:', e);
    }

    // If AI failed or returned nothing, create basic placeholders
    if (!pairs || pairs.length === 0) {
      pairs = Array.from({ length: count }, (_, i) => ({
        front: `What is key concept ${i + 1} in ${topic}?`,
        back: `Study this concept in ${topic} — add your own notes here.`,
        hint: topic,
      }));
    }

    const created: Flashcard[] = [];
    for (const p of pairs.slice(0, count)) {
      const card = await this.create(userId, {
        front: p.front,
        back: p.back,
        hint: p.hint || '',
        deck: deck || topic,
      });
      if (card) created.push(card);
    }
    return created;
  },
};

