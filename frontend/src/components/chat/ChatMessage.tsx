import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, User, Copy, Check, Volume2, RotateCcw, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/utils/cn';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
}

// ─── Rich Markdown Renderer (ChatGPT-style) ─────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const rendered = useMemo(() => {
    if (!content) return [];
    return parseMarkdown(content);
  }, [content]);

  return <div className="markdown-body space-y-2">{rendered}</div>;
}

function parseMarkdown(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  // Split by code blocks first
  const segments = content.split(/(```[\s\S]*?```)/g);

  segments.forEach((segment, si) => {
    if (segment.startsWith('```')) {
      // Code block
      const inner = segment.slice(3, -3).trim();
      const firstNewline = inner.indexOf('\n');
      const lang = firstNewline > 0 ? inner.slice(0, firstNewline).trim() : '';
      const code = firstNewline > 0 ? inner.slice(firstNewline + 1) : inner;
      nodes.push(
        <div key={`code-${si}`} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-inner">
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">{lang || 'code'}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm text-slate-200 leading-relaxed font-mono whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
      return;
    }

    // Process non-code segments line by line
    const lines = segment.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // H1
      if (trimmed.startsWith('# ')) {
        nodes.push(
          <h1 key={`h1-${si}-${i}`} className="text-xl font-bold text-white mt-4 mb-2 leading-tight">
            {renderInline(trimmed.slice(2))}
          </h1>
        );
        i++;
        continue;
      }

      // H2
      if (trimmed.startsWith('## ')) {
        nodes.push(
          <h2 key={`h2-${si}-${i}`} className="text-base font-bold text-white mt-3 mb-1.5 border-b border-white/10 pb-1">
            {renderInline(trimmed.slice(3))}
          </h2>
        );
        i++;
        continue;
      }

      // H3
      if (trimmed.startsWith('### ')) {
        nodes.push(
          <h3 key={`h3-${si}-${i}`} className="text-sm font-bold text-slate-100 mt-2 mb-1">
            {renderInline(trimmed.slice(4))}
          </h3>
        );
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        nodes.push(
          <blockquote key={`bq-${si}-${i}`} className="border-l-2 border-violet-500 pl-3 my-2 text-slate-300 italic bg-violet-500/5 py-1.5 rounded-r-lg text-sm">
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        nodes.push(<hr key={`hr-${si}-${i}`} className="border-white/10 my-3" />);
        i++;
        continue;
      }

      // Collect bullet list items (- or * or +)
      if (/^[-*+]\s/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
          items.push(lines[i].trim().slice(2));
          i++;
        }
        nodes.push(
          <ul key={`ul-${si}-${i}`} className="space-y-1 my-1.5 pl-4">
            {items.map((item, ii) => (
              <li key={ii} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                <span className="text-violet-400 mt-1 flex-shrink-0">•</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Collect numbered list items
      if (/^\d+\.\s/.test(trimmed)) {
        const items: string[] = [];
        let num = 1;
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
          num++;
        }
        nodes.push(
          <ol key={`ol-${si}-${i}`} className="space-y-1 my-1.5 pl-4">
            {items.map((item, ii) => (
              <li key={ii} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                <span className="text-violet-400 font-semibold flex-shrink-0 min-w-[1rem]">{ii + 1}.</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Regular paragraph
      nodes.push(
        <p key={`p-${si}-${i}`} className="text-sm text-slate-200 leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
      i++;
    }
  });

  return nodes;
}

// Render inline markdown: bold, italic, code, links
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold + Italic ***text***
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      // Bold **text**
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[3]}</strong>);
    } else if (match[4]) {
      // Italic *text*
      parts.push(<em key={match.index} className="italic text-slate-300">{match[4]}</em>);
    } else if (match[5]) {
      // Inline code `code`
      parts.push(
        <code key={match.index} className="bg-white/10 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono">
          {match[5]}
        </code>
      );
    } else if (match[6] && match[7]) {
      // Link [text](url)
      parts.push(
        <a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
          {match[6]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

// ─── ChatMessage Component ───────────────────────────────────────────────────
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
      const utterance = new SpeechSynthesisUtterance(message.content.replace(/[#*`_~\[\]]/g, ''));
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex gap-3 justify-end group"
      >
        <div className="max-w-[80%] lg:max-w-[70%]">
          <div className="bg-violet-600/90 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-lg">
            {message.content}
          </div>
          <div className="text-right text-xs text-slate-500 mt-1 mr-1">{message.timestamp}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex gap-3 group"
    >
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center flex-shrink-0 mt-1 shadow-glow-sm">
        <Brain className="w-4 h-4 text-white" />
      </div>

      {/* AI Message Bubble */}
      <div className="flex-1 min-w-0 max-w-[90%] lg:max-w-[85%]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            StudyOS AI
            <Sparkles className="w-3 h-3 text-violet-400" />
          </span>
          <span className="text-xs text-slate-500">{message.timestamp}</span>
        </div>

        {/* Content */}
        <div className={cn(
          'rounded-2xl rounded-tl-sm border px-4 py-3',
          'bg-surface-800/60 border-white/8 backdrop-blur-sm',
          message.isStreaming && 'animate-pulse-subtle'
        )}>
          {message.isStreaming ? (
            <div className="space-y-2">
              <MarkdownRenderer content={message.content} />
              <span className="inline-block w-2 h-4 bg-violet-400 rounded-sm animate-pulse ml-0.5" />
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Actions */}
        {!message.isStreaming && (
          <div className="flex items-center gap-4 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleSpeak}
              className={cn(
                'flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors',
                speaking && 'text-violet-400'
              )}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {speaking ? 'Stop' : 'Listen'}
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
