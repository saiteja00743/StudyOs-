import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, MessageSquare, FileText, FileSearch, BookOpen,
  Layers, Calendar, BarChart3, Settings, Plus, Zap, Brain, Sparkles, X,
  Command, Volume2, ArrowRight,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { notesService } from '@/services/notesService';
import { quizService } from '@/services/quizService';
import { flashcardService } from '@/services/flashcardService';
import { cn } from '@/utils/cn';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const notes = notesService.getAll();
  const quizzes = quizService.getAll();
  const decks = flashcardService.getDecks();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const navCommands = [
    { label: 'Go to Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Go to AI Chat Tutor', path: ROUTES.CHAT, icon: MessageSquare, category: 'Navigation' },
    { label: 'Go to Smart Notes', path: ROUTES.NOTES, icon: FileText, category: 'Navigation' },
    { label: 'Go to PDF Intelligence', path: ROUTES.PDF, icon: FileSearch, category: 'Navigation' },
    { label: 'Go to Quiz Generator', path: ROUTES.QUIZ, icon: BookOpen, category: 'Navigation' },
    { label: 'Go to Flashcards', path: ROUTES.FLASHCARDS, icon: Layers, category: 'Navigation' },
    { label: 'Go to Study Planner', path: ROUTES.PLANNER, icon: Calendar, category: 'Navigation' },
    { label: 'Go to Analytics', path: ROUTES.ANALYTICS, icon: BarChart3, category: 'Navigation' },
    { label: 'Go to Settings', path: ROUTES.SETTINGS, icon: Settings, category: 'Navigation' },
  ];

  const filteredNav = navCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(query.toLowerCase()) ||
    n.content.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(query.toLowerCase()) ||
    q.topic.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: -10, opacity: 0 }}
          className="w-full max-w-xl glass rounded-3xl border border-white/10 overflow-hidden shadow-card-hover"
        >
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-surface-900/60">
            <Search className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, quizzes, or jump to any module..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              autoFocus
            />
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results feed */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-3 no-scrollbar">
            {/* Quick Actions */}
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5">Navigation</p>
              {filteredNav.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
                    <span>{label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                </button>
              ))}
            </div>

            {/* Matching Notes */}
            {filteredNotes.length > 0 && (
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5">Matching Notes</p>
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNavigate(ROUTES.NOTES)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </div>
                    <span className="text-2xs text-slate-500">{note.folder}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Matching Quizzes */}
            {filteredQuizzes.length > 0 && (
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5">Matching Quizzes</p>
                {filteredQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => handleNavigate(ROUTES.QUIZ)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{quiz.title}</span>
                    </div>
                    <span className="text-2xs text-slate-500">{quiz.questions.length} Qs</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 bg-surface-950/40 text-2xs text-slate-500 flex items-center justify-between">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">Esc</kbd> to exit</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-400" /> StudyOS Command Palette
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
