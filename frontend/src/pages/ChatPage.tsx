import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Brain, Atom, Calculator, Code, Target, BookOpen,
  Plus, Trash2, ArrowDown, RefreshCw, MessageSquare, Key, Zap,
} from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ApiKeyModal } from '@/components/chat/ApiKeyModal';
import { chatService } from '@/services/chatService';
import { hasApiKey } from '@/services/geminiClient';
import { ChatMessage as ChatMessageType, ChatSession, SubjectFocus, SuggestedQuestion } from '@/types/chat';
import { cn } from '@/utils/cn';

const SUBJECT_OPTIONS: { id: SubjectFocus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'general', label: 'General Tutor', icon: Brain, color: 'text-brand-400' },
  { id: 'math_science', label: 'Math & Science', icon: Atom, color: 'text-cyan-400' },
  { id: 'coding', label: 'Coding / CS', icon: Code, color: 'text-emerald-400' },
  { id: 'humanities', label: 'Humanities & Writing', icon: BookOpen, color: 'text-amber-400' },
  { id: 'exam_prep', label: 'Exam Coach', icon: Target, color: 'text-rose-400' },
];

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('studyos_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectFocus>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiConnected, setAiConnected] = useState(hasApiKey());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial suggestions
  useEffect(() => {
    setSuggestedQuestions(chatService.getSuggestedQuestions());
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('studyos_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle switching or initializing session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages);
      setSelectedSubject(activeSession.subject_focus || 'general');
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const createNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Study Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
      subject_focus: selectedSubject,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setMessages([]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputPrompt.trim();
    if (!content || isGenerating) return;

    setInputPrompt('');
    setIsGenerating(true);

    const userMessage: ChatMessageType = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject_focus: selectedSubject,
    };

    let currentSessionId = activeSessionId;
    let updatedSessions = [...sessions];

    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: currentSessionId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [userMessage],
        subject_focus: selectedSubject,
      };
      updatedSessions = [newSession, ...updatedSessions];
      setActiveSessionId(currentSessionId);
    }

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    // Placeholder streaming message
    const streamingMsgId = `ast-${Date.now()}`;
    const streamingPlaceholder: ChatMessageType = {
      id: streamingMsgId,
      role: 'assistant',
      content: '...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject_focus: selectedSubject,
      isStreaming: true,
    };

    setMessages([...nextMessages, streamingPlaceholder]);

    try {
      const resultMessage = await chatService.sendMessage(
        content,
        selectedSubject,
        nextMessages,
        currentSessionId,
        (streamedChunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMsgId ? { ...msg, content: streamedChunk, isStreaming: true } : msg
            )
          );
        }
      );

      const finalMessages = [...nextMessages, { ...resultMessage, isStreaming: false }];
      setMessages(finalMessages);

      // Update session state
      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              title: session.messages.length === 0 ? content.slice(0, 30) : session.title,
              messages: finalMessages,
              updated_at: new Date().toISOString(),
            };
          }
          return session;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  return (
    <>
    <div className="flex h-[calc(100vh-5rem)] rounded-2xl overflow-hidden glass border border-white/5">
      {/* Sidebar history */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={createNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-surface-950/60">
        {/* Top Chat Bar — Subject pills & Actions */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-surface-900/40 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {SUBJECT_OPTIONS.map((sub) => {
              const Icon = sub.icon;
              const isSelected = selectedSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                    isSelected
                      ? 'bg-brand-500 text-white shadow-glow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isSelected ? 'text-white' : sub.color)} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Status / Key button */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                aiConnected
                  ? 'border-success/30 bg-success/10 text-success hover:bg-success/20'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 animate-pulse'
              )}
              title={aiConnected ? 'Gemini AI connected — click to manage key' : 'Connect Gemini AI (free)'}
            >
              {aiConnected ? <Zap className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              {aiConnected ? 'AI Active' : 'Connect AI'}
            </button>

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
          </div>
        </div>

        {/* Message Feed / Landing State */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto shadow-glow-md"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">What would you like to learn today?</h2>
                <p className="text-slate-400 text-sm">
                  Ask StudyOS AI anything. Get step-by-step explanations, code examples, math solutions, and study strategies.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
                {suggestedQuestions.map((sq) => (
                  <motion.div
                    key={sq.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => handleSendMessage(sq.prompt)}
                    className="glass p-4 rounded-xl border border-white/5 hover:border-brand-500/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs font-semibold text-brand-400 uppercase tracking-wider">{sq.category}</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                    </div>
                    <p className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors mb-1">{sq.question}</p>
                    <p className="text-2xs text-slate-400 line-clamp-2">{sq.prompt}</p>
                  </motion.div>
                ))}
              </div>
            </div>
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

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-surface-900/60">
          <div className="max-w-4xl mx-auto flex items-end gap-2 glass p-2 rounded-2xl border border-white/10 focus-within:border-brand-500/50 transition-all">
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
              placeholder={`Ask ${SUBJECT_OPTIONS.find((s) => s.id === selectedSubject)?.label}... (Press Enter to send, Shift+Enter for new line)`}
              rows={1}
              className="flex-1 bg-transparent border-0 text-sm text-white placeholder-slate-500 focus:ring-0 resize-none max-h-32 p-2 no-scrollbar"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || isGenerating}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                inputPrompt.trim() && !isGenerating
                  ? 'bg-brand-gradient text-white shadow-glow-sm hover:scale-105'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              )}
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-brand-400" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-2xs text-slate-500 mt-2">
            StudyOS AI can assist with STEM, writing, and exam prep. Always verify critical facts.
          </p>
        </div>
      </div>
    </div>

    {/* Gemini API Key Setup Modal */}
    <ApiKeyModal
      open={showApiKeyModal}
      onClose={() => setShowApiKeyModal(false)}
      onSuccess={() => setAiConnected(true)}
    />
    </>
  );
}

