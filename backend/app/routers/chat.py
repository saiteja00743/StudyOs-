import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.schemas.chat_schema import (
    ChatRequest, ChatResponse, SuggestedQuestion, ChatSessionMeta
)
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

SUGGESTED_QUESTIONS: List[SuggestedQuestion] = [
    SuggestedQuestion(
        id="sq-1",
        category="Science",
        question="Quantum Physics Basics",
        prompt="Explain quantum entanglement like I am 15 years old with real-world analogies.",
        icon="Atom"
    ),
    SuggestedQuestion(
        id="sq-2",
        category="Math",
        question="Calculus Limits & Derivatives",
        prompt="How do limits relate to derivatives in calculus? Show step-by-step examples.",
        icon="Calculator"
    ),
    SuggestedQuestion(
        id="sq-3",
        category="Coding",
        question="Big-O Time Complexity",
        prompt="Explain Big-O time complexity with Python examples for O(1), O(n), and O(n^2).",
        icon="Code"
    ),
    SuggestedQuestion(
        id="sq-4",
        category="Exam Prep",
        question="Active Recall Study Method",
        prompt="Create a 5-step active recall study plan for an upcoming exam in biology.",
        icon="Target"
    ),
]

@router.get("/suggested-questions", response_model=List[SuggestedQuestion])
async def get_suggested_questions():
    return SUGGESTED_QUESTIONS

@router.post("", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    # Format history if passed
    history_dicts = [
        {"role": msg.role, "content": msg.content}
        for msg in (request.history or [])
    ]
    
    response_text = await gemini_service.generate_chat_response(
        prompt=request.message,
        subject=request.subject_focus,
        history=history_dicts
    )
    
    return ChatResponse(
        message_id=str(uuid.uuid4()),
        session_id=session_id,
        content=response_text,
        subject_focus=request.subject_focus,
        timestamp=datetime.utcnow().isoformat()
    )
