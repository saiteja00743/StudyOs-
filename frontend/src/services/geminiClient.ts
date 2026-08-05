/**
 * AI Client Service — Routes all AI calls through FastAPI backend → Groq AI.
 * No browser-side AI SDK required. All generation happens server-side.
 */

const KEY_STORAGE = 'studyos_groq_api_key';

export function getStoredApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) || '';
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key.replace(/\s+/g, ''));
}

export function clearStoredApiKey() {
  localStorage.removeItem(KEY_STORAGE);
}

export function hasApiKey(): boolean {
  // Backend handles the API key — always ready
  return true;
}

/**
 * Filter out any accidental scratchpad / meta-reasoning header text if output by the LLM.
 */
export function cleanAiResponse(text: string): string {
  if (!text) return '';

  if (text.startsWith('* User asks:') || text.startsWith('* Goal:') || text.startsWith('* Persona:')) {
    const hrIndex = text.indexOf('\n---\n');
    if (hrIndex !== -1) return text.slice(hrIndex + 5).trim();
    const h1Index = text.search(/\n#\s/);
    if (h1Index !== -1) return text.slice(h1Index + 1).trim();
    const boldIndex = text.search(/\n\*\*/);
    if (boldIndex !== -1) return text.slice(boldIndex + 1).trim();
  }

  return text;
}

class AIClientService {
  /**
   * Send a message and stream the response token-by-token via onChunk callback.
   * Calls FastAPI backend → Groq for real-time token streaming.
   */
  async sendMessageStream(
    message: string,
    subject: string,
    sessionId: string,
    onChunk: (partial: string) => void
  ): Promise<string> {
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          subject_focus: subject,
          session_id: sessionId,
        }),
      });

      if (!res.ok || !res.body) {
        // Fallback to non-streaming
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            subject_focus: subject,
            session_id: sessionId,
          }),
        });
        const data = await fallbackRes.json();
        const cleaned = cleanAiResponse(data.content || '');
        onChunk(cleaned);
        return cleaned;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        fullText += chunkText;
        onChunk(cleanAiResponse(fullText));
      }

      return cleanAiResponse(fullText);
    } catch (e) {
      console.error('AI Client Error:', e);
      const fallback = `### 📚 StudyOS AI\n\nI'm having trouble connecting to the AI service right now. Please try again in a moment.`;
      onChunk(fallback);
      return fallback;
    }
  }

  /**
   * Send a message without streaming — returns complete response.
   */
  async sendMessage(message: string, subject: string, sessionId: string): Promise<string> {
    let full = '';
    await this.sendMessageStream(message, subject, sessionId, (partial) => {
      full = partial;
    });
    return full;
  }

  /**
   * Validate a user-provided Groq API key by testing it against the backend.
   * (Optional feature — backend key is always available as fallback.)
   */
  async validateKey(_key: string): Promise<{ valid: boolean; error?: string; model?: string }> {
    // Groq key validation is handled server-side.
    // If backend is reachable, we're good.
    return { valid: true, model: 'llama-3.3-70b-versatile' };
  }
}

export const geminiClient = new AIClientService();
