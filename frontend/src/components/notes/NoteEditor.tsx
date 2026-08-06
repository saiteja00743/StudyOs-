import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import HighlightExtension from '@tiptap/extension-highlight';
import TaskListExtension from '@tiptap/extension-task-list';
import TaskItemExtension from '@tiptap/extension-task-item';
import ImageExtension from '@tiptap/extension-image';
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
  action: (editor: any) => void;
  isAction?: 'draw';
}

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

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  // ─── Tiptap Editor Initialization ──────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      HighlightExtension.configure({ multicolor: true }),
      TaskListExtension,
      TaskItemExtension.configure({ nested: true }),
      ImageExtension.configure({ inline: false, allowBase64: true }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setSaveState('typing');
    },
  });

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
      if (editor && note.content) {
        editor.commands.setContent(note.content);
      }
    } else {
      setTitle('');
      setContent('');
      setFolder('General');
      setTags([]);
      setIsStarred(false);
      setWordCount(0);
      setLastSavedTime(null);
      if (editor) {
        editor.commands.setContent('<p></p>');
      }
    }
    setSaveState('idle');
  }, [note?.id, editor]);

  // Word count & relative save time ticker
  useEffect(() => {
    const text = editor ? editor.getText() : content;
    setWordCount(text.split(/\s+/).filter(Boolean).length);
  }, [content, editor]);

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

  // Clean raw Base64 strings from existing note text
  const handleCleanRawBase64 = () => {
    const cleaned = content
      .replace(/!\[(.*?)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+\)/gi, '')
      .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/gi, '');
    setContent(cleaned);
    if (editor) {
      editor.commands.setContent(cleaned);
    }
    setSaveState('typing');
  };

  // Handle Save
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setSaveState('saving');

    const finalContent = editor ? editor.getHTML() : content;

    let updated: Note | null = null;
    if (note) {
      updated = await notesService.update(note.id, { title, content: finalContent, folder, tags, is_starred: isStarred });
    } else if (userId) {
      updated = await notesService.create(userId, { title, content: finalContent, folder, tags, is_starred: isStarred });
    }

    if (updated) {
      onSave(updated);
      setSaveState('saved');
      setLastSavedTime(new Date());
      setTimeout(() => setSaveState('idle'), 2500);
    } else {
      setSaveState('idle');
    }
  }, [note, title, content, folder, tags, isStarred, userId, onSave, editor]);

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
          message: `Enhance and structure the following study note using clean HTML/Markdown. Keep original thoughts, then add:
1. "<h2>Key Takeaways</h2>" (bullet points)
2. "<h2>Summary</h2>" (2-3 sentences)
3. "<h2>Study Tips</h2>"

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
          setContent(enhanced);
          if (editor) editor.commands.setContent(enhanced);
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
    const textContent = editor ? editor.getText() : content;
    const markdownText = `# ${title || 'Untitled Note'}\n\n**Folder:** ${folder}\n**Tags:** ${tags.join(', ')}\n\n---\n\n${textContent}`;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'study_note').toLowerCase().replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Insert Sketch Drawing Image Data URL
  const handleSaveDrawing = (dataUrl: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: dataUrl }).run();
    } else {
      const imgTag = `<p><img src="${dataUrl}" alt="Handwritten Sketch" /></p>`;
      setContent((prev) => prev + imgTag);
    }
    setSaveState('typing');
  };

  const SLASH_COMMANDS: SlashCommand[] = [
    { id: 'h1',        label: 'Heading 1',  sub: 'Big section heading',    icon: Hash,        action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2',        label: 'Heading 2',  sub: 'Medium sub-heading',     icon: Hash,        action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'checklist', label: 'Checklist',  sub: 'Interactive task list',  icon: CheckSquare, action: (ed) => ed.chain().focus().toggleTaskList().run() },
    { id: 'code',      label: 'Code Block', sub: 'Syntax highlighted code',icon: Code2,      action: (ed) => ed.chain().focus().toggleCodeBlock().run() },
    { id: 'quote',     label: 'Quote',      sub: 'Blockquote text',        icon: Quote,       action: (ed) => ed.chain().focus().toggleBlockquote().run() },
    { id: 'sketch',    label: 'Sketch & Draw', sub: 'Draw freehand diagrams', icon: PenTool, action: () => setShowSketchModal(true), isAction: 'draw' },
  ];

  const applySlashCommand = (cmd: SlashCommand) => {
    if (editor) {
      cmd.action(editor);
    }
    setSlashOpen(false);
  };

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
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            title="Undo (Ctrl+Z)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs disabled:opacity-30"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            title="Redo (Ctrl+Y)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-all text-xs disabled:opacity-30"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Bold */}
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title="Bold"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('bold') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title="Italic"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('italic') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title="Underline"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('underline') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Highlight / Marker */}
          <button
            onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fbbf24' }).run()}
            title="Highlight Marker"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('highlight') ? "bg-amber-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Heading 1 */}
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('heading', { level: 1 }) ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Hash className="w-3.5 h-3.5" />
          </button>

          {/* Bullet List */}
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title="Bullet List"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('bulletList') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Checklist */}
          <button
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            title="Checklist"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('taskList') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          {/* Blockquote */}
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('blockquote') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Code Block */}
          <button
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all",
              editor?.isActive('codeBlock') ? "bg-brand-500 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-white/10"
            )}
          >
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

      {/* ── EDITOR & PREVIEW PANELS (Tiptap WYSIWYG Editor) ──────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Editor View */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-y-auto px-6 py-4">
            <EditorContent editor={editor} />

            {/* NOTION-STYLE SLASH COMMANDS MENU */}
            <AnimatePresence>
              {slashOpen && (
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
                    {SLASH_COMMANDS.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => applySlashCommand(cmd)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 text-stone-300 transition-colors"
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

        {/* Rendered Markdown / HTML Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 min-w-0 h-full overflow-y-auto px-6 py-4 bg-surface-950/40 no-scrollbar">
            <div
              className="prose prose-invert max-w-none space-y-3 text-sm text-stone-200 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: content || '<p class="text-stone-500 italic">Nothing to preview yet...</p>' }}
            />
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
