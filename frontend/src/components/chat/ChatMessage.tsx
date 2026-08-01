import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, User, Copy, Check, Sparkles, Volume2, RotateCcw } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/utils/cn';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(message.content.replace(/[#*`_~]/g, ''));
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  // Basic markdown code block parser
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n') || lines[0];

        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-surface-950 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-white/5 text-slate-400">
              <span className="text-2xs uppercase font-semibold text-brand-400">{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="flex items-center gap-1 text-2xs hover:text-white transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copy code
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format bold, blockquotes, and lists
      const formattedText = part.split('\n').map((line, lIdx) => {
        if (line.startsWith('### ')) {
          return <h3 key={lIdx} className="text-base font-bold text-white mt-3 mb-1">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={lIdx} className="border-l-2 border-brand-500 pl-3 my-2 text-slate-300 italic bg-brand-500/5 py-1 rounded-r-lg">
              {line.replace('> ', '')}
            </blockquote>
          );
        }
        return <p key={lIdx} className="mb-1 leading-relaxed">{line}</p>;
      });

      return <span key={index}>{formattedText}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-4 p-4 rounded-2xl border transition-all',
        isUser
          ? 'bg-brand-500/10 border-brand-500/20 ml-8 lg:ml-16 justify-end'
          : 'glass border-white/5 mr-8 lg:mr-16'
      )}
    >
      {/* Avatar (Left side for AI) */}
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <Brain className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            {isUser ? 'You' : 'StudyOS AI Tutor'}
            {!isUser && <Sparkles className="w-3.5 h-3.5 text-brand-400 inline" />}
          </span>
          <span className="text-2xs text-slate-500">{message.timestamp}</span>
        </div>

        <div className="text-sm text-slate-200 leading-relaxed font-sans">
          {renderFormattedContent(message.content)}
        </div>

        {/* Message Actions (AI messages only) */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-3 pt-2 mt-2 border-t border-white/5 text-slate-400">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-2xs hover:text-white transition-colors"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleSpeak}
              className={cn('flex items-center gap-1 text-2xs hover:text-white transition-colors', speaking && 'text-brand-400 animate-pulse')}
              title="Read aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {speaking ? 'Stop' : 'Listen'}
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-2xs hover:text-white transition-colors"
                title="Regenerate answer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Avatar (Right side for User) */}
      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-surface-700 border border-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}
