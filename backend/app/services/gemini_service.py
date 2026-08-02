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


gemini_service = GeminiService()
