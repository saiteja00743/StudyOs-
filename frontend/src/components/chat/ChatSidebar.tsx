import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, Edit3, Sparkles, X } from 'lucide-react';
import { ChatSession } from '@/types/chat';
import { cn } from '@/utils/cn';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  mobileOpen = false,
  onCloseMobile,
}: ChatSidebarProps) {
  const content = (
    <div className="w-64 glass border-r border-white/5 flex flex-col h-full flex-shrink-0 bg-surface-900">
      {/* Header & New Chat button */}
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <button
          onClick={() => { onNewChat(); onCloseMobile?.(); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-gradient hover:opacity-90 transition-all text-white font-medium text-sm shadow-glow-sm group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>New Chat</span>
        </button>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="p-2 text-slate-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
        <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-2">Recent Sessions</p>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs px-4">
            No previous chats. Start a new conversation!
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <motion.div
                key={session.id}
                whileHover={{ x: 2 }}
                className={cn(
                  'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all',
                  isActive
                    ? 'bg-brand-500/20 text-white font-medium border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
                onClick={() => { onSelectSession(session.id); onCloseMobile?.(); }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-brand-400' : 'text-slate-500')} />
                  <span className="truncate">{session.title || 'Untitled Study Chat'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-danger hover:bg-white/10 rounded transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Stats info */}
      <div className="p-3 border-t border-white/5 bg-surface-950/40 text-2xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-400" />
          Gemini AI Active
        </span>
        <span>Free Tier</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:block h-full">
        {content}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex"
            onClick={onCloseMobile}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
