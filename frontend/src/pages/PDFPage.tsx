import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Upload, X, FileText, Trash2,
  ChevronDown, ChevronUp, Sparkles, AlertCircle, CheckCircle2,
  Loader2, Brain, BookOpen, Zap, ClipboardList, Volume2, VolumeX,
  MessageSquare, RefreshCw, Eye, Copy, Check,
} from 'lucide-react';
import { pdfService } from '@/services/pdfService';
import { notesService } from '@/services/notesService';
import { quizService } from '@/services/quizService';
import { flashcardService } from '@/services/flashcardService';
import { useAuth } from '@/hooks/useAuth';
import { PDFDocument } from '@/types/notes';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DocStatus = PDFDocument['status'];

function StatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, { label: string; cls: string; icon: React.ElementType }> = {
    idle: { label: 'Idle', cls: 'text-slate-400 bg-slate-500/10', icon: AlertCircle },
    uploading: { label: 'Uploading…', cls: 'text-cyan-400 bg-cyan-500/10', icon: Loader2 },
    processing: { label: 'AI Analyzing…', cls: 'text-violet-400 bg-violet-500/10', icon: Loader2 },
    done: { label: 'Ready', cls: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 },
    ready: { label: 'Ready', cls: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 },
    error: { label: 'Error', cls: 'text-red-400 bg-red-500/10', icon: AlertCircle },
  };
  const { label, cls, icon: Icon } = map[status] ?? map['idle'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <Icon className={cn('w-3 h-3', (status === 'uploading' || status === 'processing') && 'animate-spin')} />
      {label}
    </span>
  );
}

/** Extract plain text from a File using FileReader (works for .txt files) */
async function extractTextFromFile(file: File): Promise<string> {
  // For .txt files, read directly
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // For PDF files, try pdfjs-dist if available
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (e) {
      console.warn('PDF text extraction failed, using filename-based analysis:', e);
      return `Document: ${file.name}. This is a PDF document of ${formatSize(file.size)}. Please analyze its content based on the title.`;
    }
  }

  return `Document: ${file.name}`;
}

/** Call backend /api/pdf/analyze with extracted text */
async function analyzeWithAI(text: string, filename: string): Promise<{
  summary: string;
  key_points: string[];
  suggested_quiz_topics: string[];
  page_count: number;
}> {
  const res = await fetch('/api/pdf/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename, max_key_points: 8 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Analysis failed (${res.status})`);
  }

  return res.json();
}

export function PDFPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<PDFDocument[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [speakingDocId, setSpeakingDocId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const all = await pdfService.getAll(user.id);
    setDocs(all);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const processFile = useCallback(async (file: File) => {
    if (!user?.id) return;

    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      alert(`Unsupported file type: ${file.name}. Please upload PDF, TXT, or DOCX.`);
      return;
    }

    // Create placeholder with "uploading" status
    const tempDoc = await pdfService.create(user.id, {
      name: file.name,
      size: file.size,
      page_count: 0,
      status: 'uploading',
      summary: '',
      key_points: [],
    });

    if (!tempDoc) return;
    await refresh();
    setExpandedId(tempDoc.id);

    // Mark as processing
    setProcessingIds((s) => new Set(s).add(tempDoc.id));
    await pdfService.update(tempDoc.id, { status: 'processing' });
    await refresh();

    try {
      // Step 1: Extract text
      const text = await extractTextFromFile(file);

      // Step 2: AI analysis via backend
      const result = await analyzeWithAI(text, file.name);

      // Step 3: Save results to Supabase
      await pdfService.update(tempDoc.id, {
        status: 'done',
        summary: result.summary,
        key_points: result.key_points,
        page_count: result.page_count,
      });
    } catch (e) {
      console.error('PDF processing error:', e);
      await pdfService.update(tempDoc.id, {
        status: 'error',
        summary: `Analysis failed: ${(e as Error).message}. The document was saved but could not be analyzed.`,
        key_points: [],
      });
    } finally {
      setProcessingIds((s) => {
        const next = new Set(s);
        next.delete(tempDoc.id);
        return next;
      });
      await refresh();
    }
  }, [user?.id, refresh]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(processFile);
  }, [processFile]);

  const handleDelete = async (id: string) => {
    await pdfService.delete(id);
    if (expandedId === id) setExpandedId(null);
    await refresh();
  };

  const handleReanalyze = async (doc: PDFDocument) => {
    if (!doc.file_url) return;
    // Re-trigger analysis — just update status to processing for visual feedback
    setProcessingIds((s) => new Set(s).add(doc.id));
    await pdfService.update(doc.id, { status: 'processing' });
    await refresh();

    try {
      const text = `Re-analyze the document titled "${doc.name}". Previous summary: ${doc.summary}`;
      const result = await analyzeWithAI(text, doc.name);
      await pdfService.update(doc.id, {
        status: 'done',
        summary: result.summary,
        key_points: result.key_points,
        page_count: result.page_count,
      });
    } catch (e) {
      await pdfService.update(doc.id, { status: 'error' });
    } finally {
      setProcessingIds((s) => { const n = new Set(s); n.delete(doc.id); return n; });
      await refresh();
    }
  };

  const handleCopySummary = (doc: PDFDocument) => {
    navigator.clipboard.writeText(doc.summary || '');
    setCopiedSummary(doc.id);
    setTimeout(() => setCopiedSummary(null), 2000);
  };

  // ── Cross-Module Actions ───────────────────────────────────────
  const handleSaveAsNotes = async (doc: PDFDocument) => {
    if (!user?.id) return;
    const keyPointsText = (doc.key_points || []).map((kp, i) => `${i + 1}. ${kp}`).join('\n');
    await notesService.create(user.id, {
      title: `📄 ${doc.name} — AI Summary`,
      content: `## 📄 AI Summary\n\n${doc.summary}\n\n---\n\n## 💡 Key Points\n\n${keyPointsText}`,
      folder: 'PDF Intelligence',
      tags: ['pdf', 'ai-summary'],
    });
    navigate(ROUTES.NOTES);
  };

  const handleGenerateQuiz = async (doc: PDFDocument) => {
    if (!user?.id) return;
    await quizService.generateFromTopic(user.id, doc.name, 'medium', 5);
    navigate(ROUTES.QUIZ);
  };

  const handleCreateFlashcards = async (doc: PDFDocument) => {
    if (!user?.id) return;
    const keyPoints = doc.key_points && doc.key_points.length > 0 ? doc.key_points : [doc.summary];
    for (const kp of keyPoints.slice(0, 8)) {
      const parts = (kp || '').split(':');
      const front = parts[0]?.trim() || 'Key Concept';
      const back = parts.slice(1).join(':').trim() || (kp || 'No description');
      await flashcardService.create(user.id, { deck: doc.name, front, back });
    }
    navigate(ROUTES.FLASHCARDS);
  };

  const handleAskAiTutor = (doc: PDFDocument) => {
    // Pass document context to chat via localStorage
    const ctx = `I've uploaded a document called "${doc.name}". Here's the summary: ${doc.summary}. Can you help me understand it and answer questions about it?`;
    localStorage.setItem('studyos_chat_preload', ctx);
    navigate(ROUTES.CHAT);
  };

  const handleSpeakSummary = (doc: PDFDocument) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingDocId === doc.id) {
      window.speechSynthesis.cancel();
      setSpeakingDocId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(doc.summary);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingDocId(null);
    utterance.onerror = () => setSpeakingDocId(null);
    setSpeakingDocId(doc.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-5 overflow-y-auto no-scrollbar pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-violet-400" />
            PDF Intelligence
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Upload documents — AI extracts real summaries, key points, quizzes, and flashcards.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold hover:opacity-90 transition-all shadow-glow-sm"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'glass rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all group',
          dragActive
            ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-violet-500/50 hover:bg-white/3'
        )}
      >
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all',
          dragActive ? 'bg-violet-500/30 scale-110' : 'bg-violet-500/10 group-hover:scale-110'
        )}>
          <Upload className={cn('w-7 h-7', dragActive ? 'text-violet-300' : 'text-violet-400')} />
        </div>
        <p className="text-sm font-semibold text-white mb-1">
          {dragActive ? 'Drop to analyze with AI!' : 'Drag & drop your documents here'}
        </p>
        <p className="text-xs text-slate-400">Supports PDF, TXT, DOCX — up to 50MB</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Brain, label: 'AI Summary', desc: 'Real Gemini AI summaries', color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { icon: ClipboardList, label: 'Key Points', desc: 'Auto-extracted insights', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { icon: BookOpen, label: 'Smart Notes', desc: 'One-click to Notes page', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Zap, label: 'Quiz Ready', desc: 'AI quiz from any document', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ icon: Icon, label, desc, color, bg }) => (
          <div key={label} className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs font-semibold text-white">{label}</p>
            <p className="text-2xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents yet. Upload your first file to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            Your Documents ({docs.length})
          </h2>

          {docs.map((doc) => {
            const isExpanded = expandedId === doc.id;
            const isProcessing = processingIds.has(doc.id) || doc.status === 'processing' || doc.status === 'uploading';
            const isSpeaking = speakingDocId === doc.id;
            const isReady = doc.status === 'done' || doc.status === 'ready';
            const hasContent = isReady && doc.summary && doc.summary.length > 20;

            return (
              <motion.div
                key={doc.id}
                layout
                className="glass rounded-2xl border border-white/5 overflow-hidden"
              >
                {/* Doc Header Row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors"
                  onClick={() => hasContent && setExpandedId(isExpanded ? null : doc.id)}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isProcessing ? 'bg-violet-500/20' : isReady ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                  )}>
                    {isProcessing
                      ? <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      : <FileText className={cn('w-5 h-5', isReady ? 'text-emerald-400' : 'text-slate-400')} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-2xs text-slate-500">{formatSize(doc.size)}</span>
                      {(doc.page_count ?? 0) > 0 && <span className="text-2xs text-slate-500">{doc.page_count} pages</span>}
                      <span className="text-2xs text-slate-500">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    {isProcessing && (
                      <p className="text-2xs text-violet-400 mt-1 animate-pulse">
                        🤖 AI is analyzing your document…
                      </p>
                    )}
                  </div>

                  <StatusBadge status={doc.status} />

                  {isReady && (
                    <button
                      title="Re-analyze"
                      onClick={(e) => { e.stopPropagation(); handleReanalyze(doc); }}
                      className="p-1.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-violet-400 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="p-1.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {hasContent && (
                    isExpanded
                      ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                </div>

                {/* Error State */}
                {doc.status === 'error' && (
                  <div className="mx-4 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {doc.summary || 'Analysis failed. Please try uploading again.'}
                    </p>
                  </div>
                )}

                {/* Expanded AI Results */}
                <AnimatePresence>
                  {isExpanded && hasContent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-5 grid md:grid-cols-2 gap-6">
                        {/* AI Summary */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> AI Summary
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopySummary(doc)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-2xs bg-white/5 text-slate-400 hover:text-white transition-all"
                              >
                                {copiedSummary === doc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedSummary === doc.id ? 'Copied!' : 'Copy'}
                              </button>
                              <button
                                onClick={() => handleSpeakSummary(doc)}
                                className={cn(
                                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium transition-all',
                                  isSpeaking ? 'bg-amber-500 text-white animate-pulse' : 'bg-white/5 text-slate-400 hover:text-white'
                                )}
                              >
                                {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                {isSpeaking ? 'Stop' : 'Listen'}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">{doc.summary}</p>
                        </div>

                        {/* Key Points */}
                        <div>
                          <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-3">
                            <ClipboardList className="w-3.5 h-3.5" /> Key Points
                          </h4>
                          {doc.key_points && doc.key_points.length > 0 ? (
                            <ul className="space-y-2">
                              {doc.key_points.map((kp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-2xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  {kp}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500">No key points extracted.</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-5 pb-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                        <button
                          onClick={() => handleSaveAsNotes(doc)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/15 text-violet-300 text-xs font-semibold hover:bg-violet-500 hover:text-white transition-all"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Save as Notes
                        </button>
                        <button
                          onClick={() => handleGenerateQuiz(doc)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-semibold hover:bg-amber-500 hover:text-white transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" /> Generate Quiz
                        </button>
                        <button
                          onClick={() => handleCreateFlashcards(doc)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <Brain className="w-3.5 h-3.5" /> Create Flashcards
                        </button>
                        <button
                          onClick={() => handleAskAiTutor(doc)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-semibold hover:bg-cyan-500 hover:text-white transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Ask AI Tutor
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
