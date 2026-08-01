import { ChatMessage, SubjectFocus, SuggestedQuestion } from '@/types/chat';
import { geminiClient, hasApiKey } from '@/services/geminiClient';

const DEFAULT_SUGGESTIONS: SuggestedQuestion[] = [
  {
    id: 'sq-1',
    category: 'Science',
    question: 'Quantum Entanglement',
    prompt: 'Explain quantum entanglement simply with real-world analogies.',
    icon: 'Atom',
  },
  {
    id: 'sq-2',
    category: 'Math',
    question: 'Calculus Derivatives',
    prompt: 'How do limits relate to derivatives in calculus? Give a step-by-step example.',
    icon: 'Calculator',
  },
  {
    id: 'sq-3',
    category: 'Coding',
    question: 'Big-O Notation',
    prompt: 'Explain Big-O time complexity with code snippets in Python for O(1), O(n), and O(n²).',
    icon: 'Code',
  },
  {
    id: 'sq-4',
    category: 'Exam Prep',
    question: 'Active Recall',
    prompt: 'Create a 5-step active recall study technique outline for my upcoming exams.',
    icon: 'Target',
  },
  {
    id: 'sq-5',
    category: 'Science',
    question: 'Neural Networks',
    prompt: 'Explain how a neural network learns — what is backpropagation in simple terms?',
    icon: 'Brain',
  },
  {
    id: 'sq-6',
    category: 'Math',
    question: 'Linear Algebra',
    prompt: 'Why are matrices important in machine learning? Give a concrete example.',
    icon: 'Grid',
  },
];

export const chatService = {
  getSuggestedQuestions(): SuggestedQuestion[] {
    return DEFAULT_SUGGESTIONS;
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

    // ── Real Gemini AI path ────────────────────────────────
    if (hasApiKey()) {
      try {
        let content = '';

        if (onChunk) {
          // Streaming mode
          content = await geminiClient.sendMessageStream(
            message,
            subject,
            sessionId,
            onChunk
          );
        } else {
          content = await geminiClient.sendMessage(message, subject, sessionId);
        }

        return { id: messageId, role: 'assistant', content, timestamp, subject_focus: subject };
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        const isQuota = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota');
        const content = isQuota
          ? `⚠️ **Gemini API quota reached.** You've hit the free-tier rate limit. Wait a minute and try again, or check your quota at [Google AI Studio](https://aistudio.google.com).`
          : `⚠️ **AI Error**: ${errorMsg}\n\nPlease check your API key in Settings.`;

        return { id: messageId, role: 'assistant', content, timestamp, subject_focus: subject };
      }
    }

    // ── Mock fallback (no key configured) ─────────────────
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

    return {
      id: messageId,
      role: 'assistant',
      content: fullText,
      timestamp,
      subject_focus: subject,
    };
  },
};

function generateMockTutorResponse(prompt: string, subject: SubjectFocus): string {
  const labels: Record<SubjectFocus, string> = {
    general: 'General Tutor',
    math_science: 'Math & Science',
    coding: 'CS Mentor',
    humanities: 'Humanities Tutor',
    exam_prep: 'Exam Coach',
  };

  return `### 🧠 StudyOS AI (${labels[subject]}) — Demo Mode

> ⚡ **Connect your free Gemini API key to get real AI responses!**
> Click the key icon (🔑) in the top-right of the chat to set up in 30 seconds.

---

Great question about: **"${prompt}"**

Here's a structured breakdown:

1. **Core Concept** — Break the problem into its fundamental components and understand each in isolation.

2. **Key Insight** — Connect abstract ideas to real-world examples to build lasting intuition.

3. **Practice Approach** — Active recall and spaced repetition are more effective than passive re-reading.

\`\`\`python
# Example: Smart study helper
def master_topic(topic: str) -> str:
    steps = ["Understand", "Practice", "Teach", "Review"]
    for step in steps:
        print(f"{step}: {topic}")
    return "Mastered! ✅"

master_topic("${prompt.slice(0, 30)}")
\`\`\`

> 💡 **Pro Tip**: Would you like me to generate a **Practice Quiz** or **Flashcards** for this topic?`;
}
