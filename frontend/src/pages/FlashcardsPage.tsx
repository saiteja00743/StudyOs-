import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, RotateCcw, CheckCircle2, XCircle, Brain,
  ThumbsUp, Smile, Frown, AlertCircle, Eye, EyeOff,
  ChevronLeft, ChevronRight, Trash2, Sparkles, TrendingUp, Loader2,
} from 'lucide-react';
import { Flashcard, FlashcardDeck } from '@/types/study';
import { flashcardService } from '@/services/flashcardService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const STATUS_COLORS = {
  new: 'text-slate-400 bg-slate-500/10',
  learning: 'text-amber-400 bg-amber-500/10',
  review: 'text-blue-400 bg-blue-500/10',
  mastered: 'text-emerald-400 bg-emerald-500/10',
};

const DECK_COLORS: string[] = [
  'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-blue-500',
];

// ─── Flashcard Review Mode ─────────────────────────────────────
function ReviewMode({ cards, onDone, onRate }: { cards: Flashcard[]; onDone: () => void; onRate: (card: Flashcard, rating: 1 | 2 | 3 | 4) => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<{ card: Flashcard; rating: number }[]>([]);

  const card = cards[index];
  const progress = (index / cards.length) * 100;

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    await onRate(card, rating);
    setReviewed((prev) => [...prev, { card, rating }]);
    setFlipped(false);
    if (index < cards.length - 1) setIndex((i) => i + 1);
    else onDone();
  };

  if (!card) return null;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full bg-brand-gradient rounded-full" animate={{ width: `${progress}%` }} />
        </div>
        <span className="text-2xs text-slate-500 whitespace-nowrap">{index + 1}/{cards.length}</span>
      </div>

      {/* Flashcard */}
      <div className="relative h-64 cursor-pointer" onClick={() => setFlipped(!flipped)} style={{ perspective: 1000 }}>
        <motion.div
          className="w-full h-full relative"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div className="absolute inset-0 glass rounded-2xl border border-white/5 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden' }}>
            <span className="text-2xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Question</span>
            <p className="text-lg font-semibold text-white leading-relaxed">{card.front}</p>
            {card.hint && !flipped && (
              <p className="text-xs text-slate-500 mt-4 italic">💡 {card.hint}</p>
            )}
            <p className="text-2xs text-slate-600 mt-6 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Click to reveal answer
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 glass rounded-2xl border border-brand-500/20 flex flex-col items-center justify-center p-8 text-center bg-brand-500/5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-2xs text-emerald-400 font-semibold uppercase tracking-wider mb-4">Answer</span>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{card.back}</p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-center text-xs text-slate-400 mb-3">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { rating: 1 as const, label: 'Forgot', icon: XCircle, cls: 'bg-danger/10 text-danger hover:bg-danger hover:text-white border-danger/20' },
                { rating: 2 as const, label: 'Hard', icon: Frown, cls: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white border-orange-500/20' },
                { rating: 3 as const, label: 'Good', icon: Smile, cls: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border-amber-500/20' },
                { rating: 4 as const, label: 'Easy', icon: ThumbsUp, cls: 'bg-success/10 text-success hover:bg-success hover:text-white border-success/20' },
              ].map(({ rating, label, icon: Icon, cls }) => (
                <button key={rating} onClick={() => handleRate(rating)}
                  className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all', cls)}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Flashcards Page ─────────────────────────────────────
export function FlashcardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [mode, setMode] = useState<'browse' | 'review' | 'done'>('browse');
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newDeck, setNewDeck] = useState('General');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [showAiGenerate, setShowAiGenerate] = useState(false);

  const refresh = async () => {
    if (!user?.id) return;
    const [all, deckList, due] = await Promise.all([
      flashcardService.getAll(user.id),
      flashcardService.getDecks(user.id),
      flashcardService.getDueCards(user.id),
    ]);
    setCards(all);
    setDecks(deckList);
    setDueCards(due);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const filteredCards = activeDeck ? cards.filter((c) => c.deck === activeDeck) : cards;
  const reviewCards = activeDeck ? filteredCards.filter((c) => c.status !== 'mastered') : dueCards;

  const handleCreate = async () => {
    if (!newFront.trim() || !newBack.trim() || !user?.id) return;
    await flashcardService.create(user.id, { front: newFront, back: newBack, deck: newDeck });
    setNewFront(''); setNewBack(''); setShowForm(false);
    await refresh();
  };

  const handleRate = async (card: Flashcard, rating: 1 | 2 | 3 | 4) => {
    await flashcardService.review(card.id, rating, card);
  };

  const handleDelete = async (id: string) => {
    await flashcardService.delete(id);
    await refresh();
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim() || !user?.id || generating) return;
    setGenerating(true);
    try {
      await flashcardService.generateFromTopic(user.id, aiTopic.trim(), 8);
      setAiTopic('');
      setShowAiGenerate(false);
      await refresh();
    } finally {
      setGenerating(false);
    }
  };

  if (mode === 'review') {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-4">
        <button onClick={() => { setMode('browse'); refresh(); }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Decks
        </button>
        <ReviewMode cards={reviewCards.slice(0, 20)} onDone={() => { setMode('done'); refresh(); }} onRate={handleRate} />
      </div>
    );
  }

  if (mode === 'done') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto shadow-glow-md">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white">Session Complete! 🎉</h2>
        <p className="text-slate-400">Great work! Your cards have been updated with spaced repetition scheduling.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setMode('browse')} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-all">
            Browse Cards
          </button>
          <button onClick={() => { refresh(); setMode('review'); }}
            className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> Study More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-400" /> Flashcards
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Spaced repetition system — {dueCards.length} cards due for review today
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAiGenerate((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/15 text-violet-300 text-sm font-medium hover:bg-violet-500 hover:text-white transition-all">
            <Sparkles className="w-4 h-4" /> Generate with AI
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-all">
            <Plus className="w-4 h-4" /> New Card
          </button>
          {reviewCards.length > 0 && (
            <button onClick={() => setMode('review')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm">
              <Brain className="w-4 h-4" /> Study Now ({reviewCards.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Cards', value: cards.length, color: 'text-white' },
          { label: 'Mastered', value: cards.filter((c) => c.status === 'mastered').length, color: 'text-emerald-400' },
          { label: 'Learning', value: cards.filter((c) => c.status === 'learning').length, color: 'text-amber-400' },
          { label: 'Due Today', value: dueCards.length, color: 'text-brand-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 border border-white/5 text-center">
            <p className={cn('text-2xl font-black', color)}>{value}</p>
            <p className="text-2xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* AI Generate Panel */}
      <AnimatePresence>
        {showAiGenerate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl border border-violet-500/20 p-5 overflow-hidden"
          >
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Generate Flashcards with AI
            </h3>
            <p className="text-xs text-slate-400 mb-3">Enter any topic and AI will create 8 study flashcards instantly.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="e.g. Photosynthesis, React Hooks, World War II..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={handleAiGenerate}
                disabled={!aiTopic.trim() || generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Decks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Decks</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <motion.div
            whileHover={{ y: -2 }}
            onClick={() => setActiveDeck(null)}
            className={cn('glass p-4 rounded-2xl border cursor-pointer transition-all', !activeDeck ? 'border-brand-500/30 bg-brand-500/10' : 'border-white/5 hover:border-brand-500/20')}
          >
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center mb-2">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-white">All Decks</p>
            <p className="text-2xs text-slate-500 mt-0.5">{cards.length} cards</p>
          </motion.div>
          {decks.map((deck, i) => {
            const isActive = activeDeck === deck.name;
            const progress = deck.card_count > 0 ? Math.round((deck.mastered_count / deck.card_count) * 100) : 0;
            return (
              <motion.div
                key={deck.id} whileHover={{ y: -2 }}
                onClick={() => setActiveDeck(isActive ? null : deck.name)}
                className={cn('glass p-4 rounded-2xl border cursor-pointer transition-all', isActive ? 'border-brand-500/30 bg-brand-500/10' : 'border-white/5 hover:border-brand-500/20')}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white text-xs font-bold', DECK_COLORS[i % DECK_COLORS.length])}>
                  {deck.name[0]}
                </div>
                <p className="text-xs font-semibold text-white truncate">{deck.name}</p>
                <p className="text-2xs text-slate-500 mt-0.5">{deck.card_count} cards</p>
                <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Card list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          {activeDeck ? activeDeck : 'All Cards'} ({filteredCards.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filteredCards.map((card) => (
            <div key={card.id} className="glass p-4 rounded-xl border border-white/5 group hover:border-brand-500/20 transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className={cn('px-2 py-0.5 rounded-full text-2xs font-medium', STATUS_COLORS[card.status])}>
                  {card.status}
                </span>
                <button onClick={() => handleDelete(card.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-danger transition-all p-1 rounded-lg hover:bg-white/5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-semibold text-white mb-1">{card.front}</p>
              <p className="text-2xs text-slate-400 line-clamp-2">{card.back}</p>
              <p className="text-2xs text-slate-600 mt-2">{card.deck} · Reviewed {card.review_count}×</p>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Create Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-white/10 w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white">Create Flashcard</h3>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Deck</label>
                <input type="text" value={newDeck} onChange={(e) => setNewDeck(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Front (Question)</label>
                <textarea value={newFront} onChange={(e) => setNewFront(e.target.value)} rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Back (Answer)</label>
                <textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={!newFront.trim() || !newBack.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-sm">
                  Create Card
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
