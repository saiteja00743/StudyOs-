import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Star, Sparkles, Folder, MoreVertical,
  Trash2, Edit3, ArrowRight, Clock, Hash, ArrowLeft, Menu, ListFilter, Loader2,
} from 'lucide-react';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { notesService } from '@/services/notesService';
import { Note } from '@/types/notes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const FOLDER_COLORS: Record<string, string> = {
  'General': 'text-slate-400',
  'AI & Machine Learning': 'text-purple-400',
  'Computer Science': 'text-cyan-400',
  'Chemistry': 'text-emerald-400',
  'Mathematics': 'text-amber-400',
  'Physics': 'text-blue-400',
  'Biology': 'text-rose-400',
  'Humanities': 'text-orange-400',
};

function getFolderColor(folder: string): string {
  return FOLDER_COLORS[folder] || 'text-brand-400';
}

export function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<'all' | 'starred' | string>('all');
  const [folders, setFolders] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<'folders' | 'list' | 'editor'>('list');
  const [loading, setLoading] = useState(true);

  const refreshNotes = useCallback(async () => {
    if (!user?.id) return;
    const all = await notesService.getAll(user.id);
    setNotes(all);
    const folderList = await notesService.getFolders(user.id);
    setFolders(folderList);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const handleNewNote = async () => {
    if (!user?.id) return;
    const created = await notesService.create(user.id, {
      title: 'Untitled Note',
      content: '',
      folder: activeFolder !== 'all' && activeFolder !== 'starred' ? activeFolder : 'General',
    });
    if (created) {
      await refreshNotes();
      setActiveNote(created);
      setMobilePane('editor');
    }
  };

  const handleSave = async (saved: Note) => {
    await refreshNotes();
    setActiveNote(saved);
  };

  const handleDelete = async (id: string) => {
    await notesService.delete(id);
    if (activeNote?.id === id) {
      setActiveNote(null);
      setMobilePane('list');
    }
    await refreshNotes();
    setShowDeleteConfirm(null);
  };

  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    const updated = await notesService.toggleStar(id, currentStarred);
    await refreshNotes();
    if (activeNote?.id === id && updated) setActiveNote(updated);
  };

  const selectNoteMobile = (note: Note) => {
    setActiveNote(note);
    setMobilePane('editor');
  };

  // Filter
  const filtered = notes.filter((n) => {
    const matchSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchFolder =
      activeFolder === 'all' ? true
      : activeFolder === 'starred' ? n.is_starred
      : n.folder === activeFolder;

    return matchSearch && matchFolder;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] rounded-2xl overflow-hidden glass border border-white/5 relative">
      {/* ── 1. Folder Sidebar ──────────────────────────────────────── */}
      <div className={cn(
        'w-56 flex-col border-r border-white/5 bg-surface-900/40 flex-shrink-0',
        mobilePane === 'folders' ? 'flex w-full z-20 absolute inset-0 bg-surface-950' : 'hidden lg:flex'
      )}>
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={handleNewNote}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            New Note
          </button>
          {mobilePane === 'folders' && (
            <button onClick={() => setMobilePane('list')} className="p-2 text-slate-400 hover:text-white lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 no-scrollbar">
          {[
            { id: 'all', label: 'All Notes', icon: FileText },
            { id: 'starred', label: 'Starred', icon: Star },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveFolder(id); setMobilePane('list'); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left',
                activeFolder === id
                  ? 'bg-brand-500/20 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4', activeFolder === id ? 'text-brand-400' : 'text-slate-500')} />
              <span>{label}</span>
              <span className="ml-auto text-2xs text-slate-500">
                {id === 'all' ? notes.length : notes.filter((n) => n.is_starred).length}
              </span>
            </button>
          ))}

          {folders.length > 0 && (
            <>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-2 mt-2">
                Folders
              </p>
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => { setActiveFolder(f); setMobilePane('list'); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left',
                    activeFolder === f
                      ? 'bg-brand-500/20 text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Folder className={cn('w-4 h-4', getFolderColor(f))} />
                  <span className="truncate">{f}</span>
                  <span className="ml-auto text-2xs text-slate-500">
                    {notes.filter((n) => n.folder === f).length}
                  </span>
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-white/5 text-2xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Total notes</span><span className="text-slate-300">{notes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>AI-enhanced</span>
            <span className="text-purple-400">{notes.filter((n) => n.is_ai_enhanced).length}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Notes List ─────────────────────────────────────────────── */}
      <div className={cn(
        'w-64 flex-col border-r border-white/5 bg-surface-950/60 flex-shrink-0',
        mobilePane === 'list' ? 'flex w-full lg:w-64' : 'hidden lg:flex'
      )}>
        {/* Search Header */}
        <div className="p-3 border-b border-white/5 flex items-center gap-2">
          <button onClick={() => setMobilePane('folders')} className="lg:hidden p-1.5 text-slate-400 hover:text-white">
            <ListFilter className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-brand-500/50 outline-none"
            />
          </div>

          <button onClick={handleNewNote} className="lg:hidden p-1.5 bg-brand-500 rounded-xl text-white">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Note cards list */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {searchQuery ? 'No notes match search' : 'No notes yet. Create one!'}
            </div>
          ) : (
            filtered.map((note) => {
              const isActive = activeNote?.id === note.id;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'group relative p-3 rounded-xl cursor-pointer transition-all border',
                    isActive
                      ? 'bg-brand-500/15 border-brand-500/30 text-white'
                      : 'hover:bg-white/5 border-transparent hover:border-white/5 text-slate-300'
                  )}
                  onClick={() => selectNoteMobile(note)}
                >
                  {note.is_starred && (
                    <Star className="absolute top-3 right-7 w-3 h-3 text-amber-400 fill-amber-400" />
                  )}
                  {note.is_ai_enhanced && (
                    <Sparkles className="absolute top-3 right-2 w-3 h-3 text-purple-400" />
                  )}

                  <p className="text-xs font-semibold truncate pr-6 mb-1">{note.title}</p>
                  <p className="text-2xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                    {note.content.replace(/[#*`>_]/g, '').slice(0, 80)}...
                  </p>

                  <div className="flex items-center justify-between text-2xs text-slate-600">
                    <span className={getFolderColor(note.folder)}>{note.folder}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(note.updated_at)}
                    </span>
                  </div>

                  {showDeleteConfirm === note.id ? (
                    <div className="absolute inset-0 bg-surface-900/95 rounded-xl flex items-center justify-center gap-2 p-2 text-xs">
                      <span className="text-slate-300 mr-1">Delete?</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                        className="px-2.5 py-1 rounded-lg bg-danger/80 text-white text-2xs"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(null); }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-2xs"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStar(note.id, note.is_starred); }}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-amber-400 transition-all"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(note.id); }}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-danger transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 3. Editor Pane ───────────────────────────────────────────── */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 bg-surface-950/40',
        mobilePane === 'editor' ? 'flex w-full' : 'hidden lg:flex'
      )}>
        {/* Mobile top navigation back bar */}
        <div className="lg:hidden p-2.5 border-b border-white/5 flex items-center justify-between bg-surface-900/80">
          <button
            onClick={() => setMobilePane('list')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Notes
          </button>
          <span className="text-xs font-semibold text-white truncate max-w-[160px]">
            {activeNote?.title || 'Note Editor'}
          </span>
        </div>

        <NoteEditor
          note={activeNote}
          onSave={handleSave}
          userId={user?.id}
        />
      </div>
    </div>
  );
}
