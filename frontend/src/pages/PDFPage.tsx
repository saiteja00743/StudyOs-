import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Upload, X, FileText, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Sparkles, AlertCircle, CheckCircle2,
  Loader2, Brain, BookOpen, Zap, ClipboardList, Volume2, VolumeX, MessageSquare,
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

function StatusBadge({ status }: { status: PDFDocument['status'] }) {
  const map: Record<PDFDocument['status'], { label: string; cls: string; icon: React.ElementType }> = {
    idle: { label: 'Idle', cls: 'text-slate-400 bg-slate-500/10', icon: AlertCircle },
    uploading: { label: 'Uploading', cls: 'text-cyan-400 bg-cyan-500/10', icon: Loader2 },
    processing: { label: 'Processing', cls: 'text-purple-400 bg-purple-500/10', icon: Loader2 },
    done: { label: 'Ready', cls: 'text-success bg-success/10', icon: CheckCircle2 },
    ready: { label: 'Ready', cls: 'text-success bg-success/10', icon: CheckCircle2 },
    error: { label: 'Error', cls: 'text-danger bg-danger/10', icon: AlertCircle },
  };
  const { label, cls, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${cls}`}>
      <Icon className={cn('w-3 h-3', (status === 'uploading' || status === 'processing') && 'animate-spin')} />
      {label}
    </span>
  );
}

export function PDFPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<PDFDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [speakingDocId, setSpeakingDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const all = await pdfService.getAll(user.id);
    setDocs(all);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !user?.id) return;
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        continue;
      }

      const tempId = `pdf-${Date.now()}-${file.name}`;
      setUploadProgress((p) => ({ ...p, [tempId]: 0 }));

      try {
        // Simulate processing then save metadata to Supabase
        for (let pct = 0; pct <= 100; pct += 20) {
          setUploadProgress((p) => ({ ...p, [tempId]: pct }));
          await new Promise((r) => setTimeout(r, 150));
        }
        const doc = await pdfService.create(user.id, {
          name: file.name,
          size: file.size,
          page_count: 0,
          status: 'ready',
          summary: `AI summary of "${file.name}" will appear here after processing.`,
          key_points: [],
        });
        if (doc) setExpandedId(doc.id);
      } catch (e) {
        console.error(e);
      } finally {
        setUploadProgress((p) => { const copy = { ...p }; delete copy[tempId]; return copy; });
      }
      await refresh();
    }
  }, [user?.id, refresh]);

  const handleDelete = async (id: string) => {
    await pdfService.delete(id);
    if (expandedId === id) setExpandedId(null);
    await refresh();
  };

  // ── Dynamic Cross-Module Triggers ─────────────────────────────
  const handleSaveAsNotes = async (doc: PDFDocument) => {
    if (!user?.id) return;
    const keyPointsText = (doc.key_points || []).map((kp, i) => `${i + 1}. ${kp}`).join('\n');
    await notesService.create(user.id, {
      title: `${doc.name} Summary`,
      content: `## 📄 Summary\n\n${doc.summary}\n\n### 💡 Key Points\n\n${keyPointsText}`,
      folder: 'PDF Notes',
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
    if (doc.key_points && doc.key_points.length > 0) {
      for (const kp of doc.key_points) {
        const parts = kp.split(':');
        const front = parts[0]?.trim() || 'Key Concept';
        const back = parts[1]?.trim() || kp;
        await flashcardService.create(user.id, { deck: doc.name, front, back });
      }
    } else {
      await flashcardService.create(user.id, {
        deck: doc.name,
        front: `Summary of ${doc.name}`,
        back: doc.summary,
      });
    }

    navigate(ROUTES.FLASHCARDS);
  };

  const handleAskAiTutor = (doc: PDFDocument) => {
    navigate(ROUTES.CHAT);
  };

  // ── Web Speech TTS Audio Narration ────────────────────────────
  const handleSpeakSummary = (doc: PDFDocument) => {
    if ('speechSynthesis' in window) {
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
    }
  };

  const hasUploads = Object.keys(uploadProgress).length > 0;

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-5 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-brand-400" />
            PDF Intelligence
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Upload documents and let AI extract summaries, key points, and quizzes instantly.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drag & Drop Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className="glass rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-500/50 p-8 text-center cursor-pointer transition-all hover:bg-white/3 group"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6 text-brand-400" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Drag & drop your documents here</p>
        <p className="text-xs text-slate-400">Supports PDF, DOCX, and TXT — up to 50MB</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Brain, label: 'AI Summary', desc: 'Get concise summaries in seconds', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: ClipboardList, label: 'Key Points', desc: 'Extract key points automatically', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { icon: BookOpen, label: 'Smart Notes', desc: 'Auto-convert to study notes', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Zap, label: 'Quiz Ready', desc: 'Generate quizzes from any doc', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ icon: Icon, label, desc, color, bg }) => (
          <div key={label} className="glass rounded-xl p-4 border border-white/5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs font-semibold text-white">{label}</p>
            <p className="text-2xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Uploaded Documents */}
      {docs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-400" />
            Your Documents ({docs.length})
          </h2>

          {docs.map((doc) => {
            const isExpanded = expandedId === doc.id;
            const isSpeaking = speakingDocId === doc.id;

            return (
              <motion.div
                key={doc.id}
                layout
                className="glass rounded-2xl border border-white/5 overflow-hidden"
              >
                {/* Doc Header Row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-2xs text-slate-500">
                      <span>{formatSize(doc.size)}</span>
                      {doc.page_count && <span>{doc.page_count} pages</span>}
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <StatusBadge status={doc.status} />

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="p-1.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-danger transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                </div>

                {/* Expanded AI Results */}
                <AnimatePresence>
                  {isExpanded && doc.status === 'done' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-5 grid md:grid-cols-2 gap-5">
                        {/* Summary */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold text-brand-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> AI Summary
                            </h4>
                            <button
                              onClick={() => handleSpeakSummary(doc)}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium transition-all',
                                isSpeaking ? 'bg-amber-500 text-white animate-pulse' : 'bg-white/5 text-slate-400 hover:text-white'
                              )}
                            >
                              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              {isSpeaking ? 'Stop Audio' : 'Listen Summary'}
                            </button>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{doc.summary}</p>
                        </div>

                        {/* Key Points */}
                        {doc.key_points && doc.key_points.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 mb-3">
                              <ClipboardList className="w-3.5 h-3.5" /> Key Points
                            </h4>
                            <ul className="space-y-2">
                              {doc.key_points.map((kp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-2xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  {kp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Fully Dynamic Cross-Module Action buttons */}
                      <div className="px-5 pb-4 flex gap-2 flex-wrap border-t border-white/5 pt-4">
                        <button
                          onClick={() => handleSaveAsNotes(doc)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 text-purple-300 text-xs font-medium hover:bg-purple-500 hover:text-white transition-all shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Save as Notes
                        </button>
                        <button
                          onClick={() => handleGenerateQuiz(doc)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-medium hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" /> Generate Quiz
                        </button>
                        <button
                          onClick={() => handleCreateFlashcards(doc)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-medium hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                          <Brain className="w-3.5 h-3.5" /> Create Flashcards
                        </button>
                        <button
                          onClick={() => handleAskAiTutor(doc)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-medium hover:bg-cyan-500 hover:text-white transition-all shadow-sm"
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

      {docs.length === 0 && !hasUploads && (
        <div className="text-center py-12 text-slate-500">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No documents yet. Upload your first PDF to get started.</p>
        </div>
      )}
    </div>
  );
}
