import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, ExternalLink, CheckCircle2, XCircle, Loader2,
  Eye, EyeOff, Sparkles, X, Lock, Zap,
} from 'lucide-react';
import { geminiClient, setStoredApiKey, getStoredApiKey, clearStoredApiKey } from '@/services/geminiClient';
import { cn } from '@/utils/cn';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeyModal({ open, onClose, onSuccess }: ApiKeyModalProps) {
  const [key, setKey] = useState(getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    const cleaned = key.replace(/\s+/g, '');
    if (cleaned.length < 15) {
      setStatus('error');
      setErrorMsg('Invalid key length. Please enter a valid Gemini API key.');
      return;
    }

    setStatus('validating');
    setErrorMsg('');

    const res = await geminiClient.validateKey(cleaned);
    if (res.valid) {
      setStoredApiKey(cleaned);
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } else {
      setStatus('error');
      setErrorMsg(res.error || 'Key validation failed. Please check your key and try again.');
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setKey('');
    setStatus('idle');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-md glass rounded-3xl border border-white/10 p-7 space-y-5 shadow-card-hover"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Connect Gemini AI</h2>
                  <p className="text-2xs text-slate-400 mt-0.5">Free — no credit card needed</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              {[
                { step: '1', text: 'Go to Google AI Studio', link: 'https://aistudio.google.com/app/apikey', linkLabel: 'aistudio.google.com →' },
                { step: '2', text: 'Click "Create API Key" (free, no billing required)' },
                { step: '3', text: 'Copy and paste your key below' },
              ].map(({ step, text, link, linkLabel }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 text-2xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm text-slate-300">{text}</p>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors mt-0.5">
                        {linkLabel} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Key input */}
            <div>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setStatus('idle'); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Paste your Gemini API key..."
                  className={cn(
                    'w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all font-mono',
                    'bg-white/5 text-white placeholder-slate-500',
                    status === 'error' ? 'border-danger/60 focus:ring-1 focus:ring-danger/40' :
                    status === 'success' ? 'border-success/60' :
                    'border-white/10 focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/30'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Status messages */}
              <AnimatePresence>
                {status === 'error' && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-xs text-danger mt-2">
                    <XCircle className="w-3.5 h-3.5" /> {errorMsg}
                  </motion.p>
                )}
                {status === 'success' && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-xs text-success mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Key validated! Connected to Gemini AI.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/5 text-2xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>Your key is stored only in your browser's local storage and never sent to our servers. All AI calls go directly from your browser to Google.</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {getStoredApiKey() && (
                <button onClick={handleClear}
                  className="px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-danger hover:bg-danger/10 border border-white/5 transition-all">
                  Remove Key
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!key.trim() || status === 'validating' || status === 'success'}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-sm"
              >
                {status === 'validating' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Validating...</>
                ) : status === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4" /> Connected!</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Activate Gemini AI</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
