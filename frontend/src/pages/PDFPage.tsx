import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Upload, X, FileText, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Sparkles, AlertCircle, CheckCircle2,
  Loader2, Brain, BookOpen, Zap, ClipboardList,
} from 'lucide-react';
import { pdfService } from '@/services/pdfService';
import { PDFDocument } from '@/types/notes';
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
  const [docs, setDocs] = useState<PDFDocument[]>(() => pdfService.getAll());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setDocs(pdfService.getAll());

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        continue;
      }

      const tempId = `pdf-${Date.now()}-${file.name}`;
      setUploadProgress((p) => ({ ...p, [tempId]: 0 }));

      try {
        const result = await pdfService.upload(file, (pct) => {
          setUploadProgress((p) => ({ ...p, [tempId]: pct }));
        });
        setExpandedId(result.id);
      } catch (e) {
        console.error(e);
      } finally {
        setUploadProgress((p) => { const copy = { ...p }; delete copy[tempId]; return copy; });
      }
      refresh();
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (id: string) => {
    pdfService.delete(id);
    if (expandedId === id) setExpandedId(null);
    refresh();
  };

  const hasUploads = Object.keys(uploadProgress).length > 0;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-5 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-brand-400" />
            PDF Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload documents and let AI extract summaries, key points, and quizzes instantly.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-brand-500/40 hover:bg-white/3'
        )}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
            isDragging ? 'bg-brand-gradient shadow-glow-md' : 'bg-white/5'
          )}>
            <Upload className={cn('w-7 h-7', isDragging ? 'text-white' : 'text-slate-500')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isDragging ? 'Drop files here!' : 'Drag & drop your documents'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, and TXT — up to 50MB</p>
          </div>
          {hasUploads && (
            <div className="flex items-center gap-2 text-brand-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing {Object.keys(uploadProgress).length} file(s)...
            </div>
          )}
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Brain, label: 'AI Summary', desc: 'Get concise summaries in seconds', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: ClipboardList, label: 'Key Points', desc: 'Extract the most important info', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
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
                          <h4 className="text-xs font-semibold text-brand-400 flex items-center gap-1.5 mb-3">
                            <Sparkles className="w-3.5 h-3.5" /> AI Summary
                          </h4>
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

                      {/* Action buttons */}
                      <div className="px-5 pb-4 flex gap-2 flex-wrap border-t border-white/5 pt-4">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 text-xs font-medium hover:bg-purple-500 hover:text-white transition-all">
                          <BookOpen className="w-3.5 h-3.5" /> Save as Notes
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-medium hover:bg-amber-500 hover:text-white transition-all">
                          <Zap className="w-3.5 h-3.5" /> Generate Quiz
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-medium hover:bg-emerald-500 hover:text-white transition-all">
                          <Brain className="w-3.5 h-3.5" /> Create Flashcards
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
