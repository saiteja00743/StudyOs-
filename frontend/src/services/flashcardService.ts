import { Flashcard, FlashcardDeck, FlashcardStatus, Difficulty } from '@/types/study';

const CARDS_KEY = 'studyos_flashcards';

const DEMO_CARDS: Flashcard[] = [
  {
    id: 'fc-1', front: 'What is a Neural Network?',
    back: 'A computational model inspired by the brain, consisting of interconnected nodes (neurons) organized in layers that learn patterns from data through training.',
    hint: 'Think of it as a series of mathematical transformations.',
    difficulty: 'medium', status: 'learning', deck: 'AI & Machine Learning',
    tags: ['AI', 'Deep Learning'], next_review_at: new Date().toISOString(),
    review_count: 3, ease_factor: 2.5, created_at: new Date().toISOString(),
  },
  {
    id: 'fc-2', front: 'Define Big-O Notation',
    back: 'A mathematical notation describing the upper bound of an algorithm\'s time or space complexity, expressing how performance scales with input size.',
    hint: 'It describes the worst-case scenario.',
    difficulty: 'easy', status: 'review', deck: 'Computer Science',
    tags: ['Algorithms'], next_review_at: new Date().toISOString(),
    review_count: 7, ease_factor: 2.8, created_at: new Date().toISOString(),
  },
  {
    id: 'fc-3', front: 'What is the Power Rule in Calculus?',
    back: 'If f(x) = xⁿ, then f\'(x) = n·xⁿ⁻¹\n\nExample: d/dx(x⁴) = 4x³',
    hint: 'Multiply by the exponent, then reduce the power by 1.',
    difficulty: 'easy', status: 'mastered', deck: 'Mathematics',
    tags: ['Calculus', 'Derivatives'], next_review_at: new Date().toISOString(),
    review_count: 12, ease_factor: 3.2, created_at: new Date().toISOString(),
  },
  {
    id: 'fc-4', front: 'Explain SN2 Reaction Mechanism',
    back: 'A bimolecular nucleophilic substitution where the nucleophile attacks from the back side (anti to leaving group) in a single concerted step — causing inversion of configuration (Walden inversion).',
    hint: 'Back-side attack, one step, inversion.',
    difficulty: 'hard', status: 'learning', deck: 'Chemistry',
    tags: ['Organic Chemistry'], next_review_at: new Date().toISOString(),
    review_count: 2, ease_factor: 2.1, created_at: new Date().toISOString(),
  },
  {
    id: 'fc-5', front: 'What is Recursion in programming?',
    back: 'A technique where a function calls itself with a smaller input until it reaches a base case. Every recursive function needs: 1) Base case, 2) Recursive case.\n\nExample: factorial(n) = n × factorial(n-1)',
    hint: 'A function that calls itself.',
    difficulty: 'medium', status: 'new', deck: 'Computer Science',
    tags: ['Coding', 'Algorithms'], next_review_at: new Date().toISOString(),
    review_count: 0, ease_factor: 2.5, created_at: new Date().toISOString(),
  },
  {
    id: 'fc-6', front: 'What is Newton\'s Second Law?',
    back: 'F = ma\n\nForce equals mass times acceleration. The net force on an object equals its mass multiplied by its acceleration. This is a vector equation — direction matters.',
    hint: 'F = ?',
    difficulty: 'easy', status: 'mastered', deck: 'Physics',
    tags: ['Mechanics'], next_review_at: new Date().toISOString(),
    review_count: 15, ease_factor: 3.5, created_at: new Date().toISOString(),
  },
];

function load(): Flashcard[] {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || 'null') ?? DEMO_CARDS; }
  catch { return DEMO_CARDS; }
}
function save(cards: Flashcard[]) { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); }

export const flashcardService = {
  getAll(): Flashcard[] { return load(); },

  getDecks(): FlashcardDeck[] {
    const cards = load();
    const deckMap: Record<string, FlashcardDeck> = {};
    cards.forEach((c) => {
      if (!deckMap[c.deck]) {
        deckMap[c.deck] = {
          id: `deck-${c.deck}`, name: c.deck, description: '',
          color: '#6d4bff', card_count: 0, mastered_count: 0,
          created_at: c.created_at,
        };
      }
      deckMap[c.deck].card_count++;
      if (c.status === 'mastered') deckMap[c.deck].mastered_count++;
    });
    return Object.values(deckMap);
  },

  getDueCards(): Flashcard[] {
    const now = new Date();
    return load().filter((c) => c.status !== 'mastered' && new Date(c.next_review_at) <= now);
  },

  create(data: Partial<Flashcard>): Flashcard {
    const cards = load();
    const card: Flashcard = {
      id: `fc-${Date.now()}`, front: '', back: '', difficulty: 'medium',
      status: 'new', deck: 'General', tags: [],
      next_review_at: new Date().toISOString(), review_count: 0, ease_factor: 2.5,
      created_at: new Date().toISOString(), ...data,
    };
    cards.unshift(card);
    save(cards);
    return card;
  },

  review(id: string, rating: 1 | 2 | 3 | 4): Flashcard | null {
    const cards = load();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const card = cards[idx];
    // SM-2 simplified
    let ef = card.ease_factor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
    ef = Math.max(1.3, ef);

    const intervals = [1, 3, 7, 14, 30];
    const interval = rating >= 3 ? intervals[Math.min(card.review_count, intervals.length - 1)] : 1;
    const nextReview = new Date(Date.now() + interval * 86400000);
    const status: FlashcardStatus = rating >= 4 && card.review_count >= 4 ? 'mastered'
      : rating >= 3 ? 'review' : 'learning';

    const updated: Flashcard = {
      ...card, ease_factor: ef, review_count: card.review_count + 1,
      next_review_at: nextReview.toISOString(), status,
    };
    cards[idx] = updated;
    save(cards);
    return updated;
  },

  delete(id: string) { save(load().filter((c) => c.id !== id)); },
};
