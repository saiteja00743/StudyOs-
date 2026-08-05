/**
 * chatService.ts — Supabase Cloud Storage + Backend AI Proxy
 * Routes AI generation through FastAPI backend (Render) → Gemini AI.
 * Uses VITE_API_URL for production (Vercel → Render), falls back to Vite proxy locally.
 */
import { ChatMessage, ChatSession, SubjectFocus, SuggestedQuestion } from '@/types/chat';
import { rawFrom } from '@/services/supabase';

// Production: VITE_API_URL = https://studyos-i60n.onrender.com  (or .../api — both handled)
// Local dev:  empty string → Vite proxy forwards /api → localhost:8000
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '')
  .replace(/\/api\/?$/, '')  // strip trailing /api if already included in the env var
  .replace(/\/$/, '');
const BACKEND_CHAT_URL = `${API_BASE}/api/chat`;
const BACKEND_STREAM_URL = `${API_BASE}/api/chat/stream`;


// ── Suggested Questions (static) ─────────────────────────────
const DEFAULT_SUGGESTIONS: SuggestedQuestion[] = [
  { id: 'sq-1', category: 'Science', question: 'Quantum Entanglement',
    prompt: 'Explain quantum entanglement simply with real-world analogies.', icon: 'Atom' },
  { id: 'sq-2', category: 'Math', question: 'Calculus Derivatives',
    prompt: 'How do limits relate to derivatives in calculus? Give a step-by-step example.', icon: 'Calculator' },
  { id: 'sq-3', category: 'Coding', question: 'Big-O Notation',
    prompt: 'Explain Big-O time complexity with code snippets in Python for O(1), O(n), and O(n²).', icon: 'Code' },
  { id: 'sq-4', category: 'Exam Prep', question: 'Active Recall',
    prompt: 'Create a 5-step active recall study technique outline for my upcoming exams.', icon: 'Target' },
  { id: 'sq-5', category: 'Science', question: 'Neural Networks',
    prompt: 'Explain how a neural network learns — what is backpropagation in simple terms?', icon: 'Brain' },
  { id: 'sq-6', category: 'Math', question: 'Linear Algebra',
    prompt: 'Why are matrices important in machine learning? Give a concrete example.', icon: 'Grid' },
];

// ── Session CRUD ─────────────────────────────────────────────
export const chatService = {
  getSuggestedQuestions(): SuggestedQuestion[] {
    return DEFAULT_SUGGESTIONS;
  },

  async getSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await rawFrom('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) { console.error('chatService.getSessions:', error.message); return []; }
    return (data as ChatSession[]) ?? [];
  },

  async createSession(userId: string, subject: SubjectFocus = 'general'): Promise<ChatSession | null> {
    const payload = {
      user_id: userId,
      title: 'New Chat',
      subject_focus: subject,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await rawFrom('chat_sessions').insert(payload).select().single();
    if (error) { console.error('chatService.createSession:', error.message); return null; }
    return data as ChatSession;
  },

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await rawFrom('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await rawFrom('chat_sessions').delete().eq('id', sessionId);
    if (error) { console.error('chatService.deleteSession:', error.message); return false; }
    return true;
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await rawFrom('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) { console.error('chatService.getMessages:', error.message); return []; }
    return ((data as Record<string, unknown>[]) ?? []).map((m) => ({
      id: m.id as string,
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
      timestamp: new Date(m.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject_focus: (m.subject_focus as SubjectFocus) || 'general',
    }));
  },

  async saveMessage(userId: string, sessionId: string, role: 'user' | 'assistant', content: string): Promise<string | null> {
    const { data, error } = await rawFrom('chat_messages')
      .insert({ session_id: sessionId, user_id: userId, role, content, created_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error) { console.error('chatService.saveMessage:', error.message); return null; }
    await rawFrom('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return (data as { id: string }).id;
  },

  /**
   * Send a message through FastAPI backend (Render) → Gemini AI with streaming.
   */
  async sendMessage(
    message: string,
    subject: SubjectFocus = 'general',
    history: ChatMessage[] = [],
    sessionId: string = 'default',
    onChunk?: (partial: string) => void
  ): Promise<ChatMessage> {
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const historyPayload = history.map((m) => ({
      id: m.id,
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
      timestamp: m.timestamp,
      subject_focus: m.subject_focus || subject,
    }));

    try {
      if (onChunk) {
        // Streaming path
        const res = await fetch(BACKEND_STREAM_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, subject_focus: subject, session_id: sessionId, history: historyPayload }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Backend error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          onChunk(fullText);
        }
        return { id: messageId, role: 'assistant', content: fullText, timestamp, subject_focus: subject };
      } else {
        // Non-streaming path
        const res = await fetch(BACKEND_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, subject_focus: subject, session_id: sessionId, history: historyPayload }),
        });
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        const data = await res.json();
        return { id: messageId, role: 'assistant', content: data.content || '', timestamp, subject_focus: subject };
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Connection error';
      console.error('chatService.sendMessage error:', errorMsg);
      const content = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')
        ? `⚠️ **AI quota reached.** Please wait a moment and try again.`
        : `⚠️ **Connection Error**: Could not reach the AI service.\n\nBackend: \`${API_BASE || 'localhost:8000'}\``;
      return { id: messageId, role: 'assistant', content, timestamp, subject_focus: subject };
    }
  },

  /**
   * Send a one-shot AI completion via backend (for PDF analysis, note expansion, etc.)
   */
  async askAI(prompt: string, subject: SubjectFocus = 'general'): Promise<string> {
    try {
      const res = await fetch(BACKEND_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, subject_focus: subject, session_id: `onetime-${Date.now()}`, history: [] }),
      });
      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data = await res.json();
      return data.content || '';
    } catch (e) {
      console.error('chatService.askAI error:', e);
      return '';
    }
  },

  /**
   * Send a file (image or PDF) + optional message to the AI for analysis.
   * Streams response via onChunk callback, same pattern as sendMessage.
   */
  async sendMessageWithFile(
    file: File,
    message: string,
    subject: SubjectFocus = 'general',
    sessionId: string = 'default',
    onChunk?: (partial: string) => void
  ): Promise<ChatMessage> {
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message || '');
    formData.append('subject_focus', subject);

    const analyzeUrl = `${API_BASE}/api/chat/analyze`;

    try {
      const res = await fetch(analyzeUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Backend error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        if (onChunk) onChunk(fullText);
      }

      return { id: messageId, role: 'assistant', content: fullText, timestamp, subject_focus: subject };
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Connection error';
      console.error('chatService.sendMessageWithFile error:', errorMsg);
      const content = `⚠️ **File Analysis Error**: Could not analyse the file.\n\n\`${errorMsg}\``;
      return { id: messageId, role: 'assistant', content, timestamp, subject_focus: subject };
    }
  },
};

