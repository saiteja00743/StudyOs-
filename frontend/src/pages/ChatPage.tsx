import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Brain, Atom, Calculator, Code, Target, BookOpen,
  Plus, Trash2, RefreshCw, History, ChevronDown, Paperclip, X, FileText, Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage as ChatMessageType, ChatSession, SubjectFocus, SuggestedQuestion } from '@/types/chat';
import { cn } from '@/utils/cn';

const SUBJECT_OPTIONS: { id: SubjectFocus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'general',      label: 'General Tutor',        icon: Brain,      color: 'text-brand-400'   },
  { id: 'math_science', label: 'Math & Science',        icon: Atom,       color: 'text-cyan-400'    },
  { id: 'coding',       label: 'Coding / CS',           icon: Code,       color: 'text-emerald-400' },
  { id: 'humanities',   label: 'Humanities & Writing',  icon: BookOpen,   color: 'text-amber-400'   },
  { id: 'exam_prep',    label: 'Exam Coach',            icon: Target,     color: 'text-rose-400'    },
];

// Quick prompt chips shown in the empty state (like the reference screenshot)
const QUICK_PROMPTS = [
  { label: 'Explain a concept', prompt: 'Explain a concept to me step-by-step with simple analogies.' },
  { label: 'Help me study',     prompt: 'Create a focused study plan for my upcoming exam.' },
  { label: 'Solve a problem',   prompt: 'Help me solve a problem with a detailed walkthrough.' },
  { label: 'Summarise notes',   prompt: 'Summarise my notes into key bullet points.' },
  { label: 'Quiz me',           prompt: 'Quiz me on a topic I choose to test my knowledge.' },
];

export function ChatPage() {
  const { user } = useAuth();
  const [sessions,           setSessions]           = useState<ChatSession[]>([]);
  const [activeSessionId,    setActiveSessionId]    = useState<string | null>(null);
  const [messages,           setMessages]           = useState<ChatMessageType[]>([]);
  const [inputPrompt,        setInputPrompt]        = useState('');
  const [selectedSubject,    setSelectedSubject]    = useState<SubjectFocus>('general');
  const [isGenerating,       setIsGenerating]       = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [mobileHistoryOpen,  setMobileHistoryOpen]  = useState(false);
  const [subjectOpen,        setSubjectOpen]        = useState(false);
  const [attachedFile,       setAttachedFile]       = useState<File | null>(null);
  const [filePreviewUrl,     setFilePreviewUrl]     = useState<string | null>(null);

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
    // reset so re-selecting same file triggers onChange
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setAttachedFile(null);
    setFilePreviewUrl(null);
  }, [filePreviewUrl]);

  useEffect(() => {
    setSuggestedQuestions(chatService.getSuggestedQuestions());
    if (user?.id) chatService.getSessions(user.id).then(setSessions);
  }, [user?.id]);

  useEffect(() => {
    const preload = localStorage.getItem('studyos_chat_preload');
    if (preload && user?.id) {
      localStorage.removeItem('studyos_chat_preload');
      setTimeout(() => handleSendMessage(preload), 500);
    }
  }, [user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (activeSessionId) {
      chatService.getMessages(activeSessionId).then((msgs) => {
        setMessages(msgs);
        const session = sessions.find((s) => s.id === activeSessionId);
        if (session) setSelectedSubject((session.subject_focus as SubjectFocus) || 'general');
      });
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const createNewChat = async () => {
    if (!user?.id) return;
    const session = await chatService.createSession(user.id, selectedSubject);
    if (session) {
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputPrompt.trim();
    const hasFile = !!attachedFile;
    if (!content && !hasFile) return;
    if (isGenerating || !user?.id) return;

    const fileToSend = attachedFile;
    const previewUrl = filePreviewUrl;
    setInputPrompt('');
    handleRemoveFile();
    setIsGenerating(true);

    // Build display label for user message (include filename if file attached)
    const displayContent = fileToSend
      ? `📎 **${fileToSend.name}**${content ? `\n\n${content}` : ''}`
      : content;

    const userMessage: ChatMessageType = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject_focus: selectedSubject,
    };

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const session = await chatService.createSession(user.id, selectedSubject);
      if (!session) { setIsGenerating(false); return; }
      currentSessionId = session.id;
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(currentSessionId);
      await chatService.updateSessionTitle(
        currentSessionId,
        content.slice(0, 40) + (content.length > 40 ? '...' : '')
      );
    }

    await chatService.saveMessage(user.id, currentSessionId, 'user', content);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    const streamingMsgId = `ast-${Date.now()}`;
    setMessages([...nextMessages, {
      id: streamingMsgId, role: 'assistant', content: '...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject_focus: selectedSubject, isStreaming: true,
    }]);

    try {
      const onChunk = (streamedChunk: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMsgId ? { ...msg, content: streamedChunk, isStreaming: true } : msg
          )
        );
      };

      const resultMessage = fileToSend
        ? await chatService.sendMessageWithFile(
            fileToSend, content, selectedSubject, currentSessionId, onChunk
          )
        : await chatService.sendMessage(
            content, selectedSubject, nextMessages, currentSessionId, onChunk
          );

      const finalMessages = [...nextMessages, { ...resultMessage, isStreaming: false }];
      setMessages(finalMessages);
      await chatService.saveMessage(user.id, currentSessionId, 'assistant', resultMessage.content);
      chatService.getSessions(user.id).then(setSessions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await chatService.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) { setActiveSessionId(null); setMessages([]); }
  };

  const currentSubject = SUBJECT_OPTIONS.find((s) => s.id === selectedSubject)!;
  const SubjectIcon    = currentSubject.icon;

  return (
    <>
      <div className="flex h-[calc(100vh-5rem)] rounded-2xl overflow-hidden glass border border-white/5">

        {/* ── Sidebar (desktop) ─────────────────────────────────── */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewChat={createNewChat}
          onDeleteSession={handleDeleteSession}
          mobileOpen={mobileHistoryOpen}
          onCloseMobile={() => setMobileHistoryOpen(false)}
        />

        {/* ── Main Chat Area ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-surface-950/60">

          {/* ── TOP HEADER (reference style) ─────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-900/50">

            {/* Left: mobile menu + AI avatar + name + badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileHistoryOpen(true)}
                className="md:hidden p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white"
                title="Chat history"
              >
                <History className="w-4 h-4" />
              </button>

              {/* AI Avatar */}
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              {/* Name + online + subtitle */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">StudyOS AI</span>
                  <span className="flex items-center gap-1 text-2xs font-medium text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    online
                  </span>
                </div>

                {/* Subject selector — inline dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSubjectOpen((v) => !v)}
                    className="flex items-center gap-1 text-2xs text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider font-medium"
                  >
                    <SubjectIcon className={cn('w-3 h-3', currentSubject.color)} />
                    {currentSubject.label}
                    <ChevronDown className={cn('w-3 h-3 transition-transform', subjectOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {subjectOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0,  scale: 1     }}
                        exit={{   opacity: 0, y: -6, scale: 0.95 }}
                        className="absolute top-full left-0 mt-1 z-50 glass border border-white/10 rounded-xl overflow-hidden shadow-xl w-52"
                        onMouseLeave={() => setSubjectOpen(false)}
                      >
                        {SUBJECT_OPTIONS.map((sub) => {
                          const Icon = sub.icon;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => { setSelectedSubject(sub.id); setSubjectOpen(false); }}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-all hover:bg-white/5',
                                sub.id === selectedSubject ? 'text-white font-semibold bg-white/5' : 'text-slate-400'
                              )}
                            >
                              <Icon className={cn('w-3.5 h-3.5', sub.color)} />
                              {sub.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right: New Chat button + clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMessages([]);
                  if (activeSessionId) handleDeleteSession(activeSessionId);
                }}
                className="p-2 text-slate-400 hover:text-danger hover:bg-white/10 rounded-xl transition-all"
                title="Clear active chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={createNewChat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-all text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
          </div>

          {/* ── MESSAGE FEED / WELCOME STATE ─────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">

              {messages.length === 0 ? (
                /* ── EMPTY / WELCOME STATE (reference layout) ─────── */
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center text-center py-16 space-y-6"
                >
                  {/* Large rounded icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1,   opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-brand-gradient flex items-center justify-center shadow-glow-md"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* Heading + subtitle */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-2">
                      What would you like to learn today?
                    </h2>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      Ask me anything — step-by-step explanations, code examples, math solutions, and study strategies.
                    </p>
                  </motion.div>

                  {/* ── Quick prompt pills (horizontal row, reference style) ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap justify-center gap-2 pt-2"
                  >
                    {QUICK_PROMPTS.map((qp) => (
                      <button
                        key={qp.label}
                        onClick={() => handleSendMessage(qp.prompt)}
                        className="px-4 py-2 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-brand-500/40 hover:bg-brand-500/10 transition-all"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onRegenerate={() => {
                      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                      if (lastUserMsg) handleSendMessage(lastUserMsg.content);
                    }}
                  />
                ))
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ── INPUT BAR ─────────────────────────────────────────── */}
          <div className="p-4 bg-surface-900/60">
            <div className="max-w-3xl mx-auto">

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* File preview chip (shows above input when a file is attached) */}
              <AnimatePresence>
                {attachedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mb-2 flex items-center gap-2"
                  >
                    {filePreviewUrl ? (
                      /* Image thumbnail */
                      <div className="relative group">
                        <img
                          src={filePreviewUrl}
                          alt="attachment"
                          className="h-16 w-auto max-w-[120px] rounded-xl object-cover border border-white/10"
                        />
                        <button
                          onClick={handleRemoveFile}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* PDF chip */
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="max-w-[200px] truncate">{attachedFile.name}</span>
                        <button onClick={handleRemoveFile} className="ml-1 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div className="flex items-center gap-2 glass rounded-2xl px-4 py-3 transition-all">
                {/* Paperclip / attach button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  title="Attach image or PDF"
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
                    attachedFile
                      ? 'text-brand-400 bg-brand-500/15'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  )}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={attachedFile ? 'Ask something about this file...' : 'Ask anything...'}
                  rows={1}
                  className="flex-1 bg-transparent border-0 text-sm text-white placeholder-slate-500 focus:ring-0 resize-none max-h-32 no-scrollbar leading-relaxed"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputPrompt.trim() && !attachedFile) || isGenerating}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                    (inputPrompt.trim() || attachedFile) && !isGenerating
                      ? 'bg-brand-gradient text-white shadow-glow-sm hover:scale-105'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  )}
                >
                  {isGenerating
                    ? <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>

              <p className="text-center text-2xs text-slate-600 mt-2">
                StudyOS AI · Powered by Groq · Supports images &amp; PDFs
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
