/**
 * chatService.ts — Supabase Cloud Storage
 * Chat sessions and messages stored in Supabase.
 * AI generation via Gemini (unchanged).
 */
import { ChatMessage, ChatSession, SubjectFocus, SuggestedQuestion } from '@/types/chat';
import { geminiClient, hasApiKey } from '@/services/geminiClient';
import { rawFrom } from '@/services/supabase';

// ── Suggested Questions (static, no DB needed) ───────────────
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
    // Touch session updated_at
    await rawFrom('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return (data as { id: string }).id;
  },

  /**
   * Send a message to Gemini AI with real-time streaming.
   * Falls back to mock response if no API key is configured.
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

    if (hasApiKey()) {
      try {
        let content = '';
        if (onChunk) {
          content = await geminiClient.sendMessageStream(message, subject, sessionId, onChunk);
        } else {
          content = await geminiClient.sendMessage(message, subject, sessionId);
        }
        return { id: messageId, role: 'assistant', content, timestamp, subject_focus: subject };
      } catch (err: unknown) {
        const errorMsg = (err as Error)?.message || 'Unknown error';
        const isQuota = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota');
        const content = isQuota
          ? `⚠️ **Gemini API quota reached.** You've hit the free-tier rate limit. Wait a minute and try again, or check your quota at [Google AI Studio](https://aistudio.google.com).`
          : `⚠️ **AI Error**: ${errorMsg}\n\nPlease check your API key in Settings.`;
        return { id: messageId, role: 'assistant', content, timestamp, subject_focus: subject };
      }
    }

    // Mock fallback
    const fullText = generateMockTutorResponse(message, subject);
    let accumulated = '';
    if (onChunk) {
      const words = fullText.split(' ');
      for (const word of words) {
        accumulated += (accumulated ? ' ' : '') + word;
        onChunk(accumulated);
        await new Promise((r) => setTimeout(r, 18));
      }
    }
    return { id: messageId, role: 'assistant', content: fullText, timestamp, subject_focus: subject };
  },
};

function generateMockTutorResponse(prompt: string, subject: SubjectFocus): string {
  const labels: Record<SubjectFocus, string> = {
    general: 'General Tutor', math_science: 'Math & Science',
    coding: 'CS Mentor', humanities: 'Humanities Tutor', exam_prep: 'Exam Coach',
  };
  return `### 🧠 StudyOS AI (${labels[subject]}) — Demo Mode

> ⚡ **Connect your free Gemini API key to get real AI responses!**
> Click the key icon (🔑) in the top-right of the chat to set up in 30 seconds.

---

Great question about: **"${prompt}"**

1. **Core Concept** — Break the problem into its fundamental components.
2. **Key Insight** — Connect abstract ideas to real-world examples.
3. **Practice Approach** — Active recall beats passive re-reading.

> 💡 **Pro Tip**: Would you like me to generate a **Practice Quiz** or **Flashcards** for this topic?`;
}
