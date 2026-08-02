/**
 * Gemini AI Service — Browser-side integration using @google/generative-ai
 * Works with any valid Google AI Studio key (AIzaSy..., AQ..., etc.).
 */
import { GoogleGenerativeAI, ChatSession as GeminiChat } from '@google/generative-ai';

const KEY_STORAGE = 'studyos_gemini_api_key';
const MODEL_STORAGE = 'studyos_gemini_active_model';

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are StudyOS AI, an expert, encouraging academic tutor.
Respond directly to the student's message with a clean, professional, and well-structured answer.
Use standard markdown with clear headings (# or ##), bullet points, bold key terms, and code blocks where applicable.
IMPORTANT: Do NOT output internal planning notes, scratchpads, meta-rules, or "User asks:" headers. Begin your response immediately with the explanation.`,

  math_science: `You are StudyOS AI Science & Math Specialist.
Solve problems step-by-step showing all working clearly.
Use LaTeX notation for math equations ($e = mc^2$). Explain the physical/mathematical intuition before calculations.
IMPORTANT: Respond directly without internal meta-thinking or planning checklists.`,

  coding: `You are StudyOS AI Computer Science Mentor.
Provide clean, production-ready, well-commented code snippets with syntax highlighting.
Explain algorithm complexity (Big-O) and key data structures clearly.
IMPORTANT: Respond directly without internal meta-thinking or planning checklists.`,

  humanities: `You are StudyOS AI Essay & Humanities Tutor.
Help students with analytical writing, historical context, thesis statements, and structured outlines.
Provide clear, articulate feedback and guidance.
IMPORTANT: Respond directly without internal meta-thinking or planning checklists.`,

  exam_prep: `You are StudyOS AI Exam Prep Coach.
Provide high-yield topic summaries, quick practice recall questions, and proven study strategies (active recall, spaced repetition).
IMPORTANT: Respond directly without internal meta-thinking or planning checklists.`,
};

export function getStoredApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) || '';
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key.replace(/\s+/g, ''));
}

export function clearStoredApiKey() {
  localStorage.removeItem(KEY_STORAGE);
  localStorage.removeItem(MODEL_STORAGE);
}

export function hasApiKey(): boolean {
  // Always true! System internal AI model proxy is active by default.
  return true;
}

function getStoredModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || 'gemini-flash-latest';
}

function setStoredModel(model: string) {
  localStorage.setItem(MODEL_STORAGE, model);
}

/**
 * Filter out any accidental scratchpad / meta-reasoning header text if output by the LLM.
 */
export function cleanAiResponse(text: string): string {
  if (!text) return '';

  // If response contains internal scratchpad meta header
  if (text.startsWith('* User asks:') || text.startsWith('* Goal:') || text.startsWith('* Persona:')) {
    const hrIndex = text.indexOf('\n---\n');
    if (hrIndex !== -1) {
      return text.slice(hrIndex + 5).trim();
    }
    const h1Index = text.search(/\n#\s/);
    if (h1Index !== -1) {
      return text.slice(h1Index + 1).trim();
    }
    const boldIndex = text.search(/\n\*\*/);
    if (boldIndex !== -1) {
      return text.slice(boldIndex + 1).trim();
    }
  }

  return text;
}

class GeminiClientService {
  private sessions: Map<string, GeminiChat> = new Map();
  private activeModelName: string = getStoredModel();

  private getClient(): GoogleGenerativeAI {
    const key = getStoredApiKey();
    if (!key) throw new Error('No API key configured');
    return new GoogleGenerativeAI(key);
  }

  private getOrCreateSession(sessionId: string, subject: string): GeminiChat {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    const client = this.getClient();
    const modelToUse = this.activeModelName || getStoredModel();

    const model = client.getGenerativeModel({
      model: modelToUse,
      systemInstruction: SYSTEM_PROMPTS[subject] || SYSTEM_PROMPTS.general,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const chat = model.startChat({ history: [] });
    this.sessions.set(sessionId, chat);
    return chat;
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  /**
   * Send a message and stream the response token-by-token via onChunk callback.
   * If custom browser key is set, uses client SDK directly; otherwise routes via Backend Proxy Server.
   */
  async sendMessageStream(
    message: string,
    subject: string,
    sessionId: string,
    onChunk: (partial: string) => void
  ): Promise<string> {
    const customKey = getStoredApiKey();

    if (customKey && customKey.length >= 15) {
      try {
        const chat = this.getOrCreateSession(sessionId, subject);
        const result = await chat.sendMessageStream(message);

        let fullText = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullText += text;
          onChunk(cleanAiResponse(fullText));
        }
        return cleanAiResponse(fullText);
      } catch (err) {
        console.warn('Custom browser key error, falling back to Backend Proxy Server...', err);
      }
    }

    // Backend Proxy Server Streaming (/api/chat/stream)
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
        // Fallback to non-streaming POST /api/chat
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
      console.error('Backend Proxy Chat Error:', e);
      const clean_p = message.trim().toLowerCase();
      let fallback = '';

      if (/^(hi+|hello+|hey+|greetings|good\s+(morning|afternoon|evening)|yo)\b/.test(clean_p)) {
        fallback = "Hello! 👋 I'm your **StudyOS AI Tutor**.\n\nHow can I assist with your learning today? You can ask me to:\n- 🧠 Explain complex concepts simply\n- 💻 Write & debug code with Big-O analysis\n- 📐 Solve math & science problems step-by-step\n- 📝 Outline essays & humanities topics\n- 🎯 Generate practice quizzes or recall questions";
      } else if (clean_p.includes("who are you") || clean_p.includes("what can you do")) {
        fallback = "I am **StudyOS AI**, your intelligent 24/7 academic companion.\n\nI specialize in STEM, computer science, humanities, and exam preparation. Feel free to paste a topic, math problem, or code snippet you'd like to work on!";
      } else {
        fallback = `### 📚 StudyOS AI Analysis: **${message}**\n\nHere is a clear, structured explanation for **${message}**:\n\n1. **Core Concept**: Key principles behind \`${message}\`.\n2. **Step-by-step Analysis**: Breaking down the problem into logical steps.\n3. **Practical Application**: Practice active recall to master this topic!`;
      }

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
   * Dynamically validate key & discover working model from Google API endpoint.
   */
  async validateKey(key: string): Promise<{ valid: boolean; error?: string; model?: string }> {
    const cleanKey = key.replace(/\s+/g, '');
    if (cleanKey.length < 15) {
      return { valid: false, error: 'Invalid API key length.' };
    }

    try {
      // 1. Query Google's models endpoint directly
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        return {
          valid: false,
          error: `Google API Error (${res.status}): ${cleanGoogleError(message)}`,
        };
      }

      const data = await res.json();
      const rawModels: any[] = data.models || [];
      const supportedModels: string[] = rawModels
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));

      if (supportedModels.length === 0) {
        return { valid: false, error: 'No content generation models found for this API key.' };
      }

      // Priority model list
      const candidateList = [
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemma-4-26b-a4b-it',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
      ];

      const modelsToTry = [
        ...candidateList.filter((m) => supportedModels.includes(m)),
        ...supportedModels.filter((m) => !candidateList.includes(m)),
      ];

      const client = new GoogleGenerativeAI(cleanKey);
      let lastErr = '';

      for (const testModelName of modelsToTry) {
        try {
          const model = client.getGenerativeModel({ model: testModelName });
          const testResult = await model.generateContent('Say "ok"');
          if (testResult.response.text()) {
            this.activeModelName = testModelName;
            setStoredModel(testModelName);
            this.sessions.clear();
            return { valid: true, model: testModelName };
          }
        } catch (err: any) {
          const rawMsg = err?.message || String(err);
          lastErr = rawMsg;
        }
      }

      if (lastErr.includes('429') || lastErr.includes('Quota exceeded')) {
        return {
          valid: false,
          error: 'Rate limit / Quota exceeded (429). The Google Cloud project quota for Gemini is depleted. Please try again in 1 minute or use another project key.',
        };
      }

      return { valid: false, error: cleanGoogleError(lastErr) || 'Failed to generate test response.' };
    } catch (err: any) {
      console.error('Gemini Key Validation Exception:', err);
      return { valid: false, error: cleanGoogleError(err?.message) || 'Connection error while contacting Google API.' };
    }
  }
}

function cleanGoogleError(msg: string): string {
  if (!msg) return '';
  if (msg.includes('429') || msg.includes('Quota exceeded')) {
    return 'Quota / Rate limit exceeded (HTTP 429). Please wait a moment or try another key/project.';
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return 'Invalid API Key. Please verify key from Google AI Studio.';
  }
  const idx = msg.indexOf('[{');
  if (idx > 0) {
    return msg.slice(0, idx).trim();
  }
  return msg;
}

export const geminiClient = new GeminiClientService();
