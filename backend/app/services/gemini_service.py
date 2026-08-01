import os
from typing import AsyncGenerator, List, Dict, Any

SUBJECT_SYSTEM_PROMPTS: Dict[str, str] = {
    "general": (
        "You are StudyOS AI, an encouraging, patient, and highly intelligent AI Study Tutor. "
        "Your goal is to help students learn effectively. Explain concepts simply with clear visual formatting, "
        "use code blocks for code, latex notation for math, and break complex topics into digestible steps. "
        "Ask engaging follow-up questions to test student comprehension."
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

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-1.5-flash"
        
    def _get_system_prompt(self, subject: str) -> str:
        return SUBJECT_SYSTEM_PROMPTS.get(subject, SUBJECT_SYSTEM_PROMPTS["general"])

    async def generate_chat_response(
        self,
        prompt: str,
        subject: str = "general",
        history: List[Dict[str, str]] = None
    ) -> str:
        system_instruction = self._get_system_prompt(subject)
        
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            # Fallback mock smart response if API key is not set
            return (
                f"### StudyOS AI Tutor ({subject.replace('_', ' ').title()} Mode)\n\n"
                f"Thank you for asking: **'{prompt}'**!\n\n"
                f"Here is a structured explanation:\n\n"
                f"1. **Core Concept**: Understanding the key principles behind `{prompt}`.\n"
                f"2. **Key Insight**: Break down complex problems into step-by-step logic.\n"
                f"3. **Practical Application**: Practice with relevant examples and flashcards.\n\n"
                f"```python\n"
                f"# Example study helper script\n"
                f"def study_smart(topic):\n"
                f"    print(f'Mastering: {{topic}}')\n"
                f"    return 'Success!'\n"
                f"```\n\n"
                f"Would you like me to generate a practice quiz or flashcards for this topic?"
            )
            
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error communicating with Gemini AI: {str(e)}"

gemini_service = GeminiService()
