import os
import re
import asyncio
from typing import AsyncGenerator, List, Dict

# ─── System Prompts ────────────────────────────────────────────────────────────
SUBJECT_SYSTEM_PROMPTS: Dict[str, str] = {
    "general": (
        "You are StudyOS AI, an expert academic tutor. "
        "CRITICAL RULES: "
        "1. NEVER output internal planning, thinking notes, bullet-point outlines of what you plan to say, scratchpads, or meta-commentary like '* The user wants X' or '* Definition (What is it?)'. "
        "2. START your reply IMMEDIATELY with the actual answer — no preamble, no planning. "
        "3. Use clean markdown: ## headings, **bold**, bullet lists, numbered lists, and code blocks. "
        "4. Be direct, conversational, helpful like a knowledgeable friend. "
        "Format like ChatGPT does: clean, readable, structured."
    ),
    "math_science": (
        "You are StudyOS AI Science & Math Specialist. "
        "CRITICAL RULES: "
        "1. NEVER show internal planning or thinking notes. Start your answer immediately. "
        "2. Show step-by-step solutions using numbered lists. "
        "3. Use LaTeX for math ($...$). Use ## headings and **bold** for key terms. "
        "4. Be precise, clear, and direct like a textbook tutor."
    ),
    "coding": (
        "You are StudyOS AI Computer Science Mentor. "
        "CRITICAL RULES: "
        "1. NEVER show internal planning or thinking steps. Start with the answer. "
        "2. Provide clean, well-commented code in fenced code blocks. "
        "3. Always explain Big-O complexity and key concepts. "
        "4. Use ## headings and bullet points for clarity."
    ),
    "humanities": (
        "You are StudyOS AI Essay & Humanities Tutor. "
        "CRITICAL RULES: "
        "1. NEVER output planning notes or thinking steps. Give the answer directly. "
        "2. Use ## headings, bullet points, and **bold** for key terms. "
        "3. Be engaging, clear, and informative."
    ),
    "exam_prep": (
        "You are StudyOS AI Exam Prep Coach. "
        "CRITICAL RULES: "
        "1. NEVER show internal planning. Start your answer immediately. "
        "2. Give high-yield summaries, practice questions, and proven study strategies. "
        "3. Use numbered lists and bullet points for scannability."
    ),
}

# ─── Groq model config ─────────────────────────────────────────────────────────
# Primary model: llama-3.3-70b-versatile — fast, high quality, generous free tier
GROQ_CHAT_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
GROQ_QUIZ_MODEL = os.getenv("GROQ_QUIZ_MODEL", "llama-3.3-70b-versatile")

QUIZ_SYSTEM_PROMPT = """You are an expert quiz generator. Generate accurate, factually correct multiple-choice questions.
Rules:
1. Each question MUST have exactly 4 options labeled a, b, c, d
2. correct_answer MUST be exactly one of: a, b, c, or d
3. Questions must be clear, unambiguous, and factually accurate
4. Explanations must explain WHY the answer is correct
5. Do NOT include the correct answer in the explanation label — just explain the concept
6. Return ONLY valid JSON array, nothing else"""


def clean_response(text: str) -> str:
    """Strip internal AI thinking/planning notes and return clean answer text."""
    if not text:
        return ""

    lines = text.split("\n")
    cleaned_lines = []
    skip_until_real_content = True

    for line in lines:
        stripped = line.strip()

        if skip_until_real_content and not stripped:
            continue

        if re.match(
            r"^\*\s+(The user|I should|I will|I need|Goal:|Persona:|Check|Focus|Start|Use|Format|Tone|Include|Note:|Let me|First,|Then,|Finally,)",
            stripped,
            re.IGNORECASE
        ):
            continue

        if stripped:
            skip_until_real_content = False
            cleaned_lines.append(line)
        else:
            if not skip_until_real_content:
                cleaned_lines.append(line)

    result = "\n".join(cleaned_lines).strip()
    return result if result else text.strip()


class GroqAIService:
    def __init__(self):
        pass

    def _get_api_key(self) -> str:
        return os.getenv("GROQ_API_KEY", "")

    def _get_system_prompt(self, subject: str) -> str:
        return SUBJECT_SYSTEM_PROMPTS.get(subject, SUBJECT_SYSTEM_PROMPTS["general"])

    def _build_messages(self, prompt: str, history: List[Dict[str, str]], system_prompt: str) -> list:
        messages = [{"role": "system", "content": system_prompt}]
        for h in (history or []):
            role = "user" if h.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": h.get("content", "")})
        messages.append({"role": "user", "content": prompt})
        return messages

    def _no_key_response(self) -> str:
        return "Hello! 👋 I'm StudyOS AI. Please configure your Groq API key (GROQ_API_KEY) to enable AI responses."

    async def generate_chat_response(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> str:
        api_key = self._get_api_key()
        if not api_key:
            return self._no_key_response()

        from groq import AsyncGroq
        client = AsyncGroq(api_key=api_key)

        messages = self._build_messages(prompt, history, self._get_system_prompt(subject))

        try:
            completion = await client.chat.completions.create(
                model=GROQ_CHAT_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=4096,
                top_p=0.95,
            )
            raw = completion.choices[0].message.content or ""
            return clean_response(raw)
        except Exception as e:
            print(f"[Groq] generate_chat_response error: {e}")
            return f"Error communicating with Groq AI: {str(e)}"

    async def generate_chat_stream(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        if not api_key:
            yield self._no_key_response()
            return

        from groq import AsyncGroq
        client = AsyncGroq(api_key=api_key)

        messages = self._build_messages(prompt, history, self._get_system_prompt(subject))

        try:
            # True async streaming — tokens arrive as they're generated
            stream = await client.chat.completions.create(
                model=GROQ_CHAT_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=4096,
                top_p=0.95,
                stream=True,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

        except Exception as e:
            print(f"[Groq] generate_chat_stream error: {e}")
            yield f"Error connecting to Groq AI: {str(e)}"

    async def generate_quiz(
        self,
        topic: str,
        difficulty: str,
        count: int
    ) -> list:
        """Generate quiz questions using Groq. Returns validated question dicts."""
        import json
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError("GROQ_API_KEY not configured")

        prompt = f"""Generate exactly {count} multiple-choice quiz questions about "{topic}" at {difficulty} difficulty level.

Return ONLY a JSON array with this exact structure:
[
  {{
    "question": "The complete question text?",
    "options": [
      {{"id": "a", "text": "First option"}},
      {{"id": "b", "text": "Second option"}},
      {{"id": "c", "text": "Third option"}},
      {{"id": "d", "text": "Fourth option"}}
    ],
    "correct_answer": "b",
    "explanation": "Detailed explanation of why this answer is correct and others are wrong.",
    "difficulty": "{difficulty}"
  }}
]

Generate exactly {count} questions. Make them accurate, educational, and cover different aspects of {topic}."""

        from groq import AsyncGroq
        client = AsyncGroq(api_key=api_key)

        try:
            completion = await client.chat.completions.create(
                model=GROQ_QUIZ_MODEL,
                messages=[
                    {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=8192,
                top_p=0.8,
            )
            raw = completion.choices[0].message.content or ""
        except Exception as e:
            raise RuntimeError(f"Groq quiz generation failed: {e}")

        # Strip markdown fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            end_idx = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
            cleaned = "\n".join(lines[1:end_idx]).strip()

        # Extract JSON array
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start == -1 or end == -1:
            raise ValueError(f"No JSON array in Groq response. Raw: {raw[:200]}")

        parsed = json.loads(cleaned[start:end + 1])
        if not isinstance(parsed, list) or len(parsed) == 0:
            raise ValueError("Parsed result is not a non-empty list")

        # Validate and sanitize each question
        valid_questions = []
        for q in parsed:
            if not isinstance(q, dict):
                continue
            question_text = str(q.get("question", "")).strip()
            if not question_text:
                continue
            options = q.get("options", [])
            if not isinstance(options, list) or len(options) != 4:
                options = [
                    {"id": "a", "text": str(options[0]["text"]) if len(options) > 0 else "Option A"},
                    {"id": "b", "text": str(options[1]["text"]) if len(options) > 1 else "Option B"},
                    {"id": "c", "text": str(options[2]["text"]) if len(options) > 2 else "Option C"},
                    {"id": "d", "text": str(options[3]["text"]) if len(options) > 3 else "Option D"},
                ]
            correct = str(q.get("correct_answer", "a")).strip().lower()
            if correct not in ("a", "b", "c", "d"):
                correct = "a"
            valid_questions.append({
                "question": question_text,
                "options": [{"id": str(o.get("id", "")).lower(), "text": str(o.get("text", ""))} for o in options],
                "correct_answer": correct,
                "explanation": str(q.get("explanation", "")).strip(),
                "difficulty": difficulty,
            })

        if len(valid_questions) == 0:
            raise ValueError("No valid questions after validation")

        print(f"[quiz] Generated {len(valid_questions)} questions using Groq model={GROQ_QUIZ_MODEL}")
        return valid_questions


# Export with the same name so all routers that import gemini_service work unchanged
gemini_service = GroqAIService()
