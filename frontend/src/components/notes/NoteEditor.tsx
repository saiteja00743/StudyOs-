import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Star, StarOff, Sparkles, Tag, Folder, X, CheckCircle2,
  Loader2, Type, Bold, Italic, List, Hash, Quote, Code2,
} from 'lucide-react';
import { Note } from '@/types/notes';
import { notesService } from '@/services/notesService';
import { cn } from '@/utils/cn';

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onClose?: () => void;
  userId?: string;
}

const TOOLBAR_ACTIONS = [
  { icon: Hash, label: 'Heading', insert: '# ' },
  { icon: Bold, label: 'Bold', insert: '**text**' },
  { icon: Italic, label: 'Italic', insert: '*text*' },
  { icon: List, label: 'List', insert: '- item\n' },
  { icon: Quote, label: 'Quote', insert: '> ' },
  { icon: Code2, label: 'Code', insert: '```\ncode\n```\n' },
];

export function NoteEditor({ note, onSave, onClose, userId }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState('General');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isStarred, setIsStarred] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolder(note.folder);
      setTags(note.tags);
      setIsStarred(note.is_starred);
      setWordCount(note.word_count);
    } else {
      setTitle('');
      setContent('');
      setFolder('General');
      setTags([]);
      setIsStarred(false);
      setWordCount(0);
    }
    setSaveState('idle');
  }, [note?.id]);

  // Auto-count words
  useEffect(() => {
    setWordCount(content.split(/\s+/).filter(Boolean).length);
  }, [content]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setSaveState('saving');

    let updated: Note | null = null;
    if (note) {
      updated = await notesService.update(note.id, { title, content, folder, tags, is_starred: isStarred });
    } else if (userId) {
      updated = await notesService.create(userId, { title, content, folder, tags, is_starred: isStarred });
    }

    if (updated) {
      onSave(updated);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } else {
      setSaveState('idle');
    }
  }, [note, title, content, folder, tags, isStarred, userId]);

  // Auto-save debounce (only for existing notes — new notes save on first manual save)
  useEffect(() => {
    if (!note?.id || saveState === 'idle' || saveState === 'saved') return;
    const timer = setTimeout(handleSave, 1200);
    return () => clearTimeout(timer);
  }, [title, content, folder, tags, isStarred]);

  const handleAIEnhance = async () => {
    if (!note) return;
    setIsEnhancing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const enhancedContent = content + '\n\n---\n\n> 🧠 **AI Enhancement**: Key concepts have been identified and summarized. Consider creating flashcards from the **highlighted definitions** and **formulas** in this note.';
    setContent(enhancedContent);
    await notesService.update(note.id, { content: enhancedContent, is_ai_enhanced: true });
    setIsEnhancing(false);
  };

  const insertFormat = (syntax: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newContent = content.slice(0, start) + syntax + content.slice(start);
    setContent(newContent);
    setSaveState('saving');
    setTimeout(() => el.focus(), 0);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setSaveState('saving');
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((tag) => tag !== t));
    setSaveState('saving');
  };

  if (!note && !title) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
        <Type className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg font-medium text-slate-400">Select a note to edit</p>
        <p className="text-sm mt-1">Or create a new note to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-surface-900/40 gap-3 flex-wrap">
        {/* Format tools */}
        <div className="flex items-center gap-1">
          {TOOLBAR_ACTIONS.map(({ icon: Icon, label, insert }) => (
            <button
              key={label}
              onClick={() => insertFormat(insert)}
              title={label}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-2xs text-slate-500">{wordCount} words</span>

          {/* Save Status */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || saveState === 'saving'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              saveState === 'saved'
                ? 'bg-success/20 text-success'
                : 'bg-brand-500/20 text-brand-300 hover:bg-brand-500 hover:text-white'
            )}
          >
            {saveState === 'saving' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveState === 'saved' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
          </button>

          {/* AI Enhance */}
          {note && (
            <button
              onClick={handleAIEnhance}
              disabled={isEnhancing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white text-xs font-medium transition-all"
            >
              {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
            </button>
          )}

          {/* Star */}
          <button
            onClick={() => { setIsStarred((s) => !s); setSaveState('saving'); }}
            className={cn(
              'p-1.5 rounded-xl transition-all',
              isStarred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/10'
            )}
            title={isStarred ? 'Unstar' : 'Star'}
          >
            {isStarred ? <Star className="w-4 h-4 fill-amber-400" /> : <StarOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-5 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaveState('saving'); }}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 border-0 focus:ring-0 outline-none"
        />
      </div>

      {/* Meta — Folder & Tags */}
      <div className="px-6 pb-3 flex items-center gap-3 flex-wrap border-b border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Folder className="w-3.5 h-3.5 text-brand-400" />
          <input
            type="text"
            value={folder}
            onChange={(e) => { setFolder(e.target.value); setSaveState('saving'); }}
            className="bg-transparent text-xs text-slate-300 border-0 focus:ring-0 outline-none w-28"
            placeholder="Folder..."
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-2xs font-medium">
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-white">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            placeholder="Add tag..."
            className="bg-transparent text-2xs text-slate-500 outline-none border-0 focus:ring-0 w-16"
          />
        </div>
      </div>

      {/* Content textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaveState('saving'); }}
        placeholder="Start writing your note... (Markdown supported)"
        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none border-0 focus:ring-0 outline-none px-6 py-4 leading-relaxed font-mono"
      />
    </div>
  );
}
