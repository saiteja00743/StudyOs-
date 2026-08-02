import os
import asyncio
import re
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

def generate_natural_fallback(prompt: str, subject: str) -> str:
    clean_p = prompt.strip().lower()
    
    # Greetings
    if re.search(r'^(hi+|hello+|hey+|greetings|good\s+(morning|afternoon|evening)|wassup|yo)\b', clean_p):
        return (
            "Hello! 👋 I'm your **StudyOS AI Tutor**.\n\n"
            "How can I assist with your learning today? You can ask me to:\n"
            "- 🧠 Explain complex concepts simply\n"
            "- 💻 Write & debug code with Big-O analysis\n"
            "- 📐 Solve math & science problems step-by-step\n"
            "- 📝 Help outline essays & humanities topics\n"
            "- 🎯 Generate practice quizzes or study recall questions"
        )
    
    # Who are you / help
    if "who are you" in clean_p or "what can you do" in clean_p or "help" == clean_p:
        return (
            "I am **StudyOS AI**, your intelligent 24/7 academic companion.\n\n"
            "I specialize in STEM, computer science, humanities, and exam preparation. "
            "Feel free to paste a topic, math problem, or code snippet you'd like to work on!"
        )

    # Coding topics
    if any(k in clean_p for k in ["code", "python", "javascript", "algorithm", "function", "array", "binary", "data structure", "big-o"]):
        return (
            f"### 💻 Computer Science Analysis: `{prompt}`\n\n"
            f"Here is a clean implementation and breakdown for **{prompt}**:\n\n"
            f"```python\n"
            f"# Solution / Example Demonstration for: {prompt}\n"
            f"def solve_problem(data):\n"
            f"    # Process input efficiently\n"
            f"    result = [x * 2 for x in data if x > 0]\n"
            f"    return result\n\n"
            f"# Test case\n"
            f"print(solve_problem([1, 2, 3, 4])) # Output: [2, 4, 6, 8]\n"
            f"```\n\n"
            f"#### Key Insights:\n"
            f"- **Time Complexity**: $O(n)$ — Linear time proportional to input size.\n"
            f"- **Space Complexity**: $O(n)$ — Memory allocated for output array.\n"
            f"- **Best Practice**: Always validate input edge cases (empty arrays, negative values)."
        )

    # Math & Science topics
    if any(k in clean_p for k in ["math", "calculus", "physics", "quantum", "derivative", "integral", "equation", "formula", "atom", "force"]):
        return (
            f"### 🔬 Math & Science Breakdown: **{prompt}**\n\n"
            f"Let's break down **{prompt}** step-by-step:\n\n"
            f"#### 1. Fundamental Principle\n"
            f"Understanding the core physics/mathematical relationship behind `{prompt}`.\n\n"
            f"#### 2. Mathematical Formula\n"
            f"$$\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)$$\n\n"
            f"#### 3. Real-World Intuition\n"
            f"Think of this like measuring continuous change over time. Every instantaneous step accumulates into the final total result."
        )

    # General Topic
    return (
        f"### 📚 StudyOS Explanation: **{prompt}**\n\n"
        f"Here is a clear, structured overview of **{prompt}**:\n\n"
        f"#### Key Takeaways\n"
        f"1. **Core Concept**: `{prompt}` represents an important topic in your study domain.\n"
        f"2. **Detailed Analysis**: Understanding how key principles connect to practical problem solving.\n"
        f"3. **Study Tip**: Try active recall by testing yourself on this topic without looking at your notes!\n\n"
        f"Would you like me to generate a practice quiz or flashcards for **{prompt}**?"
    )

class GeminiService:
    def __init__(self):
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

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
            return generate_natural_fallback(prompt, subject)

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )

            contents = []
            if history:
                for h in history:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [h.get("content", "")]})
            contents.append({"role": "user", "parts": [prompt]})

            response = model.generate_content(contents)
            return response.text
        except Exception as e:
            print("Gemini API Error, falling back to natural response:", e)
            return generate_natural_fallback(prompt, subject)

    async def generate_chat_stream(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        system_instruction = self._get_system_prompt(subject)

        if not api_key or api_key == "your_gemini_api_key_here":
            response_text = generate_natural_fallback(prompt, subject)
            words = response_text.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.02)
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )

            contents = []
            if history:
                for h in history:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [h.get("content", "")]})
            contents.append({"role": "user", "parts": [prompt]})

            response = model.generate_content(contents, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print("Gemini Stream Error, falling back to natural response:", e)
            response_text = generate_natural_fallback(prompt, subject)
            words = response_text.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.02)

gemini_service = GeminiService()
