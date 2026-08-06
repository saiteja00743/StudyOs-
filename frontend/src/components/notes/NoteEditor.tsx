import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Star, StarOff, Sparkles, Tag, Folder, X, CheckCircle2,
  Loader2, Type, Bold, Italic, List, Hash, Quote, Code2,
  Underline, Highlighter, CheckSquare, Table, Minus, Image as ImageIcon,
  Sigma, Lightbulb, PenTool, Download, Eye, Columns, Edit3, Check,
  Undo, Redo, Wand2,
} from 'lucide-react';
import { Note } from '@/types/notes';
import { notesService } from '@/services/notesService';
import { DrawingModal } from './DrawingModal';
import { cn } from '@/utils/cn';

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onClose?: () => void;
  userId?: string;
}

type ViewMode = 'edit' | 'preview' | 'split';

// ─── Notion-Style Slash Commands ──────────────────────────────────────────────
interface SlashCommand {
  id: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  insert: string;
  isAction?: 'draw';
}

const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1',        label: 'Heading 1',  sub: 'Big section heading',    icon: Hash,        insert: '# ' },
  { id: 'h2',        label: 'Heading 2',  sub: 'Medium sub-heading',     icon: Hash,        insert: '## ' },
  { id: 'checklist', label: 'Checklist',  sub: 'Interactive task list',  icon: CheckSquare, insert: '- [ ] ' },
  { id: 'table',     label: 'Table',      sub: 'Simple markdown table',  icon: Table,       insert: '| Column 1 | Column 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n' },
  { id: 'code',      label: 'Code Block', sub: 'Syntax highlighted code',icon: Code2,      insert: '```javascript\n// Write code here\n```\n' },
  { id: 'image',     label: 'Image',      sub: 'Embed external image',   icon: ImageIcon,   insert: '![Image description](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80)\n' },
  { id: 'divider',   label: 'Divider',    sub: 'Horizontal line break',  icon: Minus,       insert: '\n---\n' },
  { id: 'quote',     label: 'Quote',      sub: 'Blockquote text',        icon: Quote,       insert: '> ' },
  { id: 'math',      label: 'Math',       sub: 'LaTeX math formula',     icon: Sigma,       insert: '$$ e = mc^2 $$\n' },
  { id: 'callout',   label: 'Callout',    sub: 'Highlighted note box',   icon: Lightbulb,   insert: '> [!NOTE]\n> Key takeaway or summary note\n' },
  { id: 'sketch',    label: 'Sketch & Draw', sub: 'Draw freehand diagrams', icon: PenTool, insert: '', isAction: 'draw' },
];

export function NoteEditor({ note, onSave, onClose, userId }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState('General');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isStarred, setIsStarred] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'typing' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [timeAgoText, setTimeAgoText] = useState('All changes saved');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [wordCount, setWordCount] = useState(0);
  const [showSketchModal, setShowSketchModal] = useState(false);

  // Undo & Redo History State
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Seed state when note prop changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolder(note.folder);
      setTags(note.tags);
      setIsStarred(note.is_starred);
      setWordCount(note.word_count);
      setLastSavedTime(new Date(note.updated_at || Date.now()));
      setHistoryStack([note.content]);
      setHistoryIdx(0);
    } else {
      setTitle('');
      setContent('');
      setFolder('General');
      setTags([]);
      setIsStarred(false);
      setWordCount(0);
      setLastSavedTime(null);
      setHistoryStack(['']);
      setHistoryIdx(0);
    }
    setSaveState('idle');
  }, [note?.id]);

  // Word count & relative save time ticker
  useEffect(() => {
    setWordCount(content.split(/\s+/).filter(Boolean).length);
  }, [content]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastSavedTime) {
        setTimeAgoText('All changes saved');
        return;
      }
      const secs = Math.floor((Date.now() - lastSavedTime.getTime()) / 1000);
      if (secs < 5) setTimeAgoText('Saved just now');
      else if (secs < 60) setTimeAgoText(`Saved ${secs}s ago`);
      else setTimeAgoText(`Saved ${Math.floor(secs / 60)}m ago`);
    }, 2000);
    return () => clearInterval(timer);
  }, [lastSavedTime]);

  // Content update with History Push
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setSaveState('typing');

    setHistoryStack((prev) => {
      const current = prev.slice(0, historyIdx + 1);
      if (current[current.length - 1] === newContent) return prev;
      const next = [...current, newContent].slice(-50);
      setHistoryIdx(next.length - 1);
      return next;
    });
  }, [historyIdx]);

  // Undo & Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setContent(historyStack[prevIdx]);
      setSaveState('typing');
    }
  }, [historyIdx, historyStack]);

  const handleRedo = useCallback(() => {
    if (historyIdx < historyStack.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setContent(historyStack[nextIdx]);
      setSaveState('typing');
    }
  }, [historyIdx, historyStack]);

  // Clean raw Base64 strings from existing note text
  const handleCleanRawBase64 = () => {
    const cleaned = content
      .replace(/!\[(.*?)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+\)/gi, '🎨 [Handwritten Sketch Attachment]')
      .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/gi, '');
    updateContent(cleaned);
  };

  // Handle Save
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
      setLastSavedTime(new Date());
      setTimeout(() => setSaveState('idle'), 2500);
    } else {
      setSaveState('idle');
    }
  }, [note, title, content, folder, tags, isStarred, userId, onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (!note?.id || !title.trim()) return;
    setSaveState('typing');
    const timer = setTimeout(() => {
      handleSave();
    }, 1200);
    return () => clearTimeout(timer);
  }, [title, content, folder, tags, isStarred]);

  // AI Enhancement
  const handleAIEnhance = async () => {
    if (!note || !content.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Enhance and structure the following study note using clean Markdown. Keep original thoughts, then add:
1. "## Key Takeaways" (bullet points)
2. "## Summary" (2-3 sentences)
3. "## Study Tips"

Title: ${title}
Content: ${content}`,
          subject_focus: 'general',
          session_id: `note-enhance-${Date.now()}`,
          history: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const enhanced = data.content || '';
        if (enhanced) {
          updateContent(enhanced);
          await notesService.update(note.id, { content: enhanced, is_ai_enhanced: true });
        }
      }
    } catch (e) {
      console.error('AI enhance failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Export to Markdown (.md)
  const handleExportMarkdown = () => {
    const markdownText = `# ${title || 'Untitled Note'}\n\n**Folder:** ${folder}\n**Tags:** ${tags.join(', ')}\n\n---\n\n${content}`;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'study_note').toLowerCase().replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Insert Rich Formatting Syntax
  const insertFormat = (before: string, after: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || 'text';
    const replacement = before + selected + after;
    const newContent = content.slice(0, start) + replacement + content.slice(end);

    updateContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // Insert Sketch Drawing Image Data URL
  const handleSaveDrawing = (dataUrl: string) => {
    const imageMarkdown = `\n![Handwritten Sketch](${dataUrl})\n`;
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const newContent = content.slice(0, start) + imageMarkdown + content.slice(start);
      updateContent(newContent);
    } else {
      updateContent(content + imageMarkdown);
    }
  };

  // Handle Slash Command Typing
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    updateContent(val);

    // Check if cursor is right after slash '/'
    const textBeforeCursor = val.slice(0, cursor);
    const lastSlashIdx = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIdx !== -1 && (lastSlashIdx === 0 || val[lastSlashIdx - 1] === '\n' || val[lastSlashIdx - 1] === ' ')) {
      const filter = textBeforeCursor.slice(lastSlashIdx + 1);
      if (!filter.includes(' ')) {
        setSlashFilter(filter.toLowerCase());
        setSlashOpen(true);
        setSlashIndex(0);
        return;
      }
    }
    setSlashOpen(false);
  };

  // Handle Keyboard Shortcuts (Ctrl+Z Undo / Ctrl+Y Redo)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  // Handle Slash Command Selection
  const applySlashCommand = (cmd: SlashCommand) => {
    if (cmd.isAction === 'draw') {
      setSlashOpen(false);
      setShowSketchModal(true);
      return;
    }

    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const textBeforeCursor = content.slice(0, cursor);
    const lastSlashIdx = textBeforeCursor.lastIndexOf('/');

    const newContent = content.slice(0, lastSlashIdx) + cmd.insert + content.slice(cursor);
    updateContent(newContent);
    setSlashOpen(false);

    setTimeout(() => {
      el.focus();
    }, 0);
  };

  const filteredSlashCmds = SLASH_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(slashFilter) || c.id.includes(slashFilter)
  );

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((tag) => tag !== t));
  };

  if (!note && !title) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 p-8">
        <Type className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg font-medium text-stone-400">Select a note to edit</p>
        <p className="text-sm mt-1">Or create a new note to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
      {/* ── TOP TOOLBAR ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-surface-900/60 gap-3 flex-wrap">
        {/* Rich Formatting Tools + Undo / Redo */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Undo & Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            title="Undo (Ctrl+Z)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs disabled:opacity-30"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIdx >= historyStack.length - 1}
            title="Redo (Ctrl+Y)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs disabled:opacity-30"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Formatting */}
          <button onClick={() => insertFormat('**', '**')} title="Bold" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('*', '*')} title="Italic" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('<u>', '</u>')} title="Underline" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('<mark>', '</mark>')} title="Highlight" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button onClick={() => insertFormat('# ')} title="Heading" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Hash className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('- ')} title="Bullet List" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('- [ ] ')} title="Checklist" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('> ')} title="Quote" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => insertFormat('```javascript\n', '\n```')} title="Code Block" className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs">
            <Code2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Sketch / Draw button */}
          <button
            onClick={() => setShowSketchModal(true)}
            title="Sketch & Draw Diagram"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/25 hover:bg-brand-500/25 transition-all text-xs font-medium"
          >
            <PenTool className="w-3.5 h-3.5" /> Sketch
          </button>

          {/* Clean Raw Base64 button if raw base64 exists in note */}
          {/data:image\/[^;]+;base64,/i.test(content) && (
            <button
              onClick={handleCleanRawBase64}
              title="Clean Raw Base64 Code from Note"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all text-xs font-semibold"
            >
              <Wand2 className="w-3.5 h-3.5" /> Clean Raw Code
            </button>
          )}
        </div>

        {/* Mode Switcher + Auto Save Status */}
        <div className="flex items-center gap-2">
          {/* View Modes */}
          <div className="flex items-center gap-0.5 bg-surface-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('edit')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-2xs font-semibold flex items-center gap-1 transition-all',
                viewMode === 'edit' ? 'bg-surface-800 text-white' : 'text-stone-400 hover:text-white'
              )}
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-2xs font-semibold flex items-center gap-1 transition-all',
                viewMode === 'preview' ? 'bg-surface-800 text-white' : 'text-stone-400 hover:text-white'
              )}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-2xs font-semibold flex items-center gap-1 transition-all',
                viewMode === 'split' ? 'bg-surface-800 text-white' : 'text-stone-400 hover:text-white'
              )}
            >
              <Columns className="w-3 h-3" /> Split
            </button>
          </div>

          {/* Auto-Save Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/3 border border-white/5 text-2xs font-medium text-stone-400">
            {saveState === 'typing' ? (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Typing...
              </span>
            ) : saveState === 'saving' ? (
              <span className="flex items-center gap-1 text-brand-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> {timeAgoText}
              </span>
            )}
          </div>

          {/* Export Markdown */}
          <button
            onClick={handleExportMarkdown}
            title="Export as Markdown (.md)"
            className="p-1.5 rounded-xl border border-white/10 text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* AI Enhance */}
          {note && (
            <button
              onClick={handleAIEnhance}
              disabled={isEnhancing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500 hover:text-white text-xs font-medium transition-all"
            >
              {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
            </button>
          )}

          {/* Star */}
          <button
            onClick={() => { setIsStarred((s) => !s); setSaveState('typing'); }}
            className={cn(
              'p-1.5 rounded-xl transition-all',
              isStarred ? 'text-amber-400 bg-amber-400/10' : 'text-stone-500 hover:text-amber-400 hover:bg-white/10'
            )}
            title={isStarred ? 'Unstar' : 'Star'}
          >
            {isStarred ? <Star className="w-4 h-4 fill-amber-400" /> : <StarOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── META HEADER (Title, Folder, Tags) ───────────────────────────── */}
      <div className="px-6 pt-4 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaveState('typing'); }}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-stone-600 border-0 focus:ring-0 outline-none"
        />
      </div>

      <div className="px-6 pb-3 flex items-center gap-3 flex-wrap border-b border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Folder className="w-3.5 h-3.5 text-brand-400" />
          <input
            type="text"
            value={folder}
            onChange={(e) => { setFolder(e.target.value); setSaveState('typing'); }}
            className="bg-transparent text-xs text-stone-300 border-0 focus:ring-0 outline-none w-28"
            placeholder="Folder..."
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-stone-500" />
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
            className="bg-transparent text-2xs text-stone-500 outline-none border-0 focus:ring-0 w-16"
          />
        </div>
      </div>

      {/* ── EDITOR & PREVIEW PANELS ────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Editor Textarea */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Start writing your note... Type '/' for Notion slash commands"
              className="flex-1 bg-transparent text-sm text-stone-200 placeholder-stone-600 resize-none border-0 focus:ring-0 outline-none px-6 py-4 leading-relaxed font-mono no-scrollbar"
            />

            {/* NOTION-STYLE SLASH COMMANDS MENU */}
            <AnimatePresence>
              {slashOpen && filteredSlashCmds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute bottom-16 left-6 z-50 w-72 bg-surface-850 border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1"
                >
                  <div className="px-3 py-1.5 border-b border-white/5 text-2xs font-semibold uppercase tracking-wider text-stone-500">
                    Slash Commands
                  </div>

                  <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                    {filteredSlashCmds.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => applySlashCommand(cmd)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                            idx === slashIndex ? 'bg-brand-500/20 text-white' : 'hover:bg-white/5 text-stone-300'
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0 text-brand-400 border border-white/5">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white leading-none">{cmd.label}</p>
                            <p className="text-2xs text-stone-500 mt-0.5 truncate">{cmd.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Split Divider */}
        {viewMode === 'split' && (
          <div className="w-px bg-white/10 h-full flex-shrink-0" />
        )}

        {/* Rendered Markdown Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 min-w-0 h-full overflow-y-auto px-6 py-4 bg-surface-950/40 no-scrollbar">
            <div className="prose prose-invert max-w-none space-y-3 text-sm text-stone-200 leading-relaxed font-sans">
              {renderMarkdownPreview(content)}
            </div>
          </div>
        )}
      </div>

      {/* ── CANVAS SKETCH MODAL ────────────────────────────────────────── */}
      <DrawingModal
        isOpen={showSketchModal}
        onClose={() => setShowSketchModal(false)}
        onSaveDrawing={handleSaveDrawing}
      />
    </div>
  );
}

// ─── Robust Markdown & Diagram Preview Renderer ──────────────────────────────
function renderMarkdownPreview(rawContent: string) {
  if (!rawContent || !rawContent.trim()) {
    return <p className="text-stone-500 italic">Nothing to preview yet...</p>;
  }

  // Pre-process content: clean up any whitespace or split newlines inside data:image URLs
  const sanitized = rawContent.replace(
    /!\[(.*?)\]\((data:image\/[^;]+;base64,[\s\S]*?)\)/g,
    (_, alt, url) => `![${alt}](${url.replace(/[\r\n\s]+/g, '')})`
  );

  const lines = sanitized.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code blocks ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${idx}`} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#161514] shadow-inner">
            <div className="flex items-center justify-between px-4 py-2 bg-[#211f1d] border-b border-white/10">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">{codeLang || 'code'}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-stone-200 font-mono whitespace-pre">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      elements.push(<div key={`gap-${idx}`} className="h-2" />);
      return;
    }

    // Image check: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/) || trimmed.match(/!\[(.*?)\]\((data:image\/[^\)]+|https?:\/\/[^\)]+)\)/);
    if (imgMatch) {
      const src = imgMatch[2].replace(/[\r\n\s]+/g, '');
      const alt = imgMatch[1] || 'Diagram Sketch';
      elements.push(
        <div key={`img-${idx}`} className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-surface-900/80 p-3 text-center group relative shadow-lg">
          <img
            src={src}
            alt={alt}
            className="max-h-96 w-auto mx-auto rounded-xl object-contain shadow-md"
          />
          <span className="text-2xs text-brand-400 mt-2 block font-mono font-medium">🎨 {alt}</span>
        </div>
      );
      return;
    }

    // Filter out raw orphan base64 lines if any somehow leak
    if (/^(iVBORw0KGgo|data:image\/|[A-Za-z0-9+/=]{40,})/.test(trimmed)) {
      return;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h1-${idx}`} className="text-2xl font-bold text-white border-b border-white/10 pb-2 mt-4">{trimmed.slice(2)}</h1>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${idx}`} className="text-lg font-bold text-white mt-3">{trimmed.slice(3)}</h2>);
      return;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h3-${idx}`} className="text-base font-bold text-stone-100 mt-2">{trimmed.slice(4)}</h3>);
      return;
    }

    // Checklists
    if (trimmed.startsWith('- [ ] ')) {
      elements.push(
        <div key={`chk-${idx}`} className="flex items-center gap-2 py-0.5">
          <input type="checkbox" className="rounded bg-surface-800 border-white/20 text-brand-500 focus:ring-0" />
          <span>{trimmed.slice(6)}</span>
        </div>
      );
      return;
    }
    if (trimmed.startsWith('- [x] ')) {
      elements.push(
        <div key={`chkx-${idx}`} className="flex items-center gap-2 py-0.5 text-stone-500 line-through">
          <input type="checkbox" checked readOnly className="rounded bg-brand-500/40 border-brand-500 text-brand-500" />
          <span>{trimmed.slice(6)}</span>
        </div>
      );
      return;
    }

    // Bullet lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={`li-${idx}`} className="ml-4 list-disc text-stone-200">
          {trimmed.slice(2)}
        </li>
      );
      return;
    }

    // Blockquotes
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`bq-${idx}`} className="border-l-2 border-brand-500 pl-3 italic text-stone-300 bg-brand-500/10 py-1.5 rounded-r-lg my-1.5">
          {trimmed.slice(2)}
        </blockquote>
      );
      return;
    }

    // Dividers
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${idx}`} className="border-white/10 my-4" />);
      return;
    }

    // Regular paragraph
    elements.push(<p key={`p-${idx}`} className="text-stone-200">{line}</p>);
  });

  return elements;
}
