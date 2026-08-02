import os
import asyncio
from typing import AsyncGenerator, List, Dict, Any

SUBJECT_SYSTEM_PROMPTS: Dict[str, str] = {
    "general": (
        "You are StudyOS AI, an encouraging, patient, and highly intelligent AI Study Tutor. "
        "Your goal is to help students learn effectively. Explain concepts simply with clear visual formatting, "
        "use code blocks for code, latex notation for math, and break complex topics into digestible steps."
    ),
    "math_science": (
        "You are StudyOS AI Science & Math Specialist. Focus on rigorous step-by-step mathematical solutions, "
        "clear explanations of physics/chemistry/biology formulas, and conceptual intuition before calculations. "
        "Use LaTeX syntax where appropriate."
    ),
    "coding": (
        "You are StudyOS AI Computer Science Mentor. Provide clean, well-commented code examples, "
        "explain algorithm complexity (Big-O), debug errors systematically, and teach clean architectural practices."
    ),
    "humanities": (
        "You are StudyOS AI Essay & Humanities Tutor. Assist with analytical writing, historical context, "
        "literary analysis, grammar feedback, and structured argument outlines."
    ),
    "exam_prep": (
        "You are StudyOS AI Exam Prep Coach. Practice recall testing, create quick quiz questions, "
        "highlight high-yield study topics, and teach time management techniques for exams."
    )
}

# Priority list of working model endpoints for Google Gemini API keys
CANDIDATE_MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemma-4-26b-a4b-it",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
]

class GeminiService:
    def __init__(self):
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    def _get_api_key(self) -> str:
        return os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY") or ""

    def _get_system_prompt(self, subject: str) -> str:
        return SUBJECT_SYSTEM_PROMPTS.get(subject, SUBJECT_SYSTEM_PROMPTS["general"])

    async def generate_chat_response(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> str:
        api_key = self._get_api_key()
        system_instruction = self._get_system_prompt(subject)

        if not api_key or api_key == "your_gemini_api_key_here":
            return f"Hello! I am StudyOS AI Tutor. How can I help you learn about **{prompt}** today?"

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            contents = []
            if history:
                for h in history:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [h.get("content", "")]})
            contents.append({"role": "user", "parts": [prompt]})

            for model_name in CANDIDATE_MODELS:
                try:
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_instruction
                    )
                    response = model.generate_content(contents)
                    if response.text:
                        return response.text
                except Exception as m_err:
                    print(f"Model {model_name} failed: {m_err}")
                    continue

            return f"Thank you for asking about **{prompt}**! I am ready to assist with your study questions."
        except Exception as e:
            print("Gemini API Error:", e)
            return f"Error communicating with AI service: {str(e)}"

    async def generate_chat_stream(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        system_instruction = self._get_system_prompt(subject)

        if not api_key or api_key == "your_gemini_api_key_here":
            fallback = f"Hello! 👋 I am your StudyOS AI Tutor. Let's discuss **{prompt}**!"
            for word in fallback.split(" "):
                yield word + " "
                await asyncio.sleep(0.02)
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            contents = []
            if history:
                for h in history:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [h.get("content", "")]})
            contents.append({"role": "user", "parts": [prompt]})

            streamed_anything = False

            for model_name in CANDIDATE_MODELS:
                try:
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        system_instruction=system_instruction
                    )
                    response = model.generate_content(contents, stream=True)
                    for chunk in response:
                        if chunk.text:
                            streamed_anything = True
                            yield chunk.text
                    if streamed_anything:
                        return
                except Exception as m_err:
                    print(f"Stream model {model_name} failed: {m_err}")
                    continue

            if not streamed_anything:
                fallback = f"Hello! I am your StudyOS AI Tutor. How can I help you master **{prompt}**?"
                for word in fallback.split(" "):
                    yield word + " "
                    await asyncio.sleep(0.02)
        except Exception as e:
            print("Gemini Stream Error:", e)
            yield f"Error connecting to AI model: {str(e)}"

gemini_service = GeminiService()
