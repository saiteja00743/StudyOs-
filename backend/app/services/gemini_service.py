import os
import re
import asyncio
from typing import AsyncGenerator, List, Dict

# ─── System Prompts (strict: no thinking output) ─────────────────────────────
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

# ─── Priority model list (tested working with free tier) ─────────────────────
CANDIDATE_MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
]

# ─── Quiz-specific model list (prefer non-thinking for structured output) ────
QUIZ_CANDIDATE_MODELS = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
]

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

        # Skip blank lines at the top
        if skip_until_real_content and not stripped:
            continue

        # Detect and skip internal planning/thinking bullet patterns
        # These are lines like: "* Definition (What is it?)" or "* The user wants..."
        if re.match(
            r"^\*\s+(The user|I should|I will|I need|Goal:|Persona:|Check|Focus|Start|Use|Format|Tone|Include|Note:|Let me|First,|Then,|Finally,)",
            stripped,
            re.IGNORECASE
        ):
            continue

        # If we hit a real line (heading, bold, numbered, or regular text)
        if stripped:
            skip_until_real_content = False
            cleaned_lines.append(line)
        else:
            if not skip_until_real_content:
                cleaned_lines.append(line)

    result = "\n".join(cleaned_lines).strip()

    # If after stripping we have nothing meaningful, return original
    if not result:
        return text.strip()

    return result


class GeminiService:
    def __init__(self):
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    def _get_api_key(self) -> str:
        return os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY") or ""

    def _get_system_prompt(self, subject: str) -> str:
        return SUBJECT_SYSTEM_PROMPTS.get(subject, SUBJECT_SYSTEM_PROMPTS["general"])

    def _build_contents(self, prompt: str, history: List[Dict[str, str]]) -> list:
        contents = []
        for h in (history or []):
            role = "user" if h.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [h.get("content", "")]})
        contents.append({"role": "user", "parts": [prompt]})
        return contents

    async def generate_chat_response(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> str:
        api_key = self._get_api_key()
        system_instruction = self._get_system_prompt(subject)
        contents = self._build_contents(prompt, history)

        if not api_key or api_key == "your_gemini_api_key_here":
            return "Hello! 👋 I'm StudyOS AI. Please configure your Gemini API key to enable real AI responses."

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            for model_name in CANDIDATE_MODELS:
                try:
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_instruction,
                        generation_config={
                            "temperature": 0.7,
                            "top_p": 0.95,
                            "max_output_tokens": 4096,
                        }
                    )
                    response = model.generate_content(contents)
                    if response.text:
                        return clean_response(response.text)
                except Exception as m_err:
                    print(f"  [model:{model_name}] Error: {m_err}")
                    continue

            return "I encountered an issue connecting to the AI model. Please try again."
        except Exception as e:
            print("Gemini API Error:", e)
            return f"Error communicating with Gemini AI: {str(e)}"

    async def generate_chat_stream(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        system_instruction = self._get_system_prompt(subject)
        contents = self._build_contents(prompt, history)

        if not api_key or api_key == "your_gemini_api_key_here":
            yield "Hello! 👋 I'm StudyOS AI. Please configure your Gemini API key to enable real AI responses."
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            for model_name in CANDIDATE_MODELS:
                try:
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_instruction,
                        generation_config={
                            "temperature": 0.7,
                            "top_p": 0.95,
                            "max_output_tokens": 4096,
                        }
                    )

                    # Accumulate full response then clean it
                    response = model.generate_content(contents, stream=True)
                    full_text = ""
                    for chunk in response:
                        if chunk.text:
                            full_text += chunk.text

                    cleaned = clean_response(full_text)

                    # Stream the cleaned text word by word for real-time feel
                    words = cleaned.split(" ")
                    for i, word in enumerate(words):
                        yield word + (" " if i < len(words) - 1 else "")
                        await asyncio.sleep(0.005)
                    return

                except Exception as m_err:
                    print(f"  [stream model:{model_name}] Error: {m_err}")
                    continue

            yield "I encountered an issue connecting to the AI model. Please try again."

        except Exception as e:
            print("Gemini Stream Error:", e)
            yield f"Error connecting to AI model: {str(e)}"


    async def generate_quiz(
        self,
        topic: str,
        difficulty: str,
        count: int
    ) -> list:
        """
        Generate accurate quiz questions using Gemini with structured output.
        Returns a list of validated question dicts.
        """
        import json
        api_key = self._get_api_key()
        if not api_key or api_key == "your_gemini_api_key_here":
            raise ValueError("GEMINI_API_KEY not configured")

        prompt = f"""Generate exactly {count} multiple-choice quiz questions about \"{topic}\" at {difficulty} difficulty level.

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

        import google.generativeai as genai
        genai.configure(api_key=api_key)

        last_error = None
        for model_name in QUIZ_CANDIDATE_MODELS:
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=QUIZ_SYSTEM_PROMPT,
                    generation_config={
                        "temperature": 0.2,
                        "top_p": 0.8,
                        "max_output_tokens": 8192,
                    }
                )
                response = model.generate_content(prompt)
                raw = response.text if response.text else ""

                # Strip markdown fences
                cleaned = raw.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    # find ending fence
                    start_idx = 1
                    end_idx = len(lines) - 1
                    if lines[-1].strip() == "```":
                        end_idx = len(lines) - 1
                    cleaned = "\n".join(lines[start_idx:end_idx]).strip()

                # Extract JSON array
                start = cleaned.find("[")
                end = cleaned.rfind("]")
                if start == -1 or end == -1:
                    raise ValueError(f"No JSON array found in response. Raw: {raw[:200]}")

                parsed = json.loads(cleaned[start:end + 1])
                if not isinstance(parsed, list) or len(parsed) == 0:
                    raise ValueError("Parsed result is not a non-empty list")

                # Validate and sanitize each question
                valid_questions = []
                for i, q in enumerate(parsed):
                    if not isinstance(q, dict):
                        continue
                    question_text = str(q.get("question", "")).strip()
                    if not question_text:
                        continue
                    options = q.get("options", [])
                    if not isinstance(options, list) or len(options) != 4:
                        # Build default options from whatever is present
                        options = [
                            {"id": "a", "text": str(options[0]["text"]) if len(options) > 0 else "Option A"},
                            {"id": "b", "text": str(options[1]["text"]) if len(options) > 1 else "Option B"},
                            {"id": "c", "text": str(options[2]["text"]) if len(options) > 2 else "Option C"},
                            {"id": "d", "text": str(options[3]["text"]) if len(options) > 3 else "Option D"},
                        ]
                    # Ensure correct_answer is a single lowercase letter
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

                print(f"[quiz] Generated {len(valid_questions)} questions using model={model_name}")
                return valid_questions

            except Exception as e:
                last_error = e
                print(f"  [quiz model:{model_name}] Error: {e}")
                continue

        raise RuntimeError(f"Quiz generation failed with all models. Last error: {last_error}")


gemini_service = GeminiService()
