"""
quiz.py — Dedicated quiz generation router.
Uses a separate endpoint from /api/chat for accurate, validated JSON output.
"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])


class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    count: int = 5


class QuizGenerateResponse(BaseModel):
    success: bool
    topic: str
    difficulty: str
    questions: list
    count: int


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(request: QuizGenerateRequest):
    """
    Generate accurate multiple-choice quiz questions using Gemini AI.
    Uses a dedicated quiz prompt with strict JSON validation.
    """
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    count = max(1, min(request.count, 20))  # clamp between 1 and 20

    try:
        questions = await gemini_service.generate_quiz(
            topic=topic,
            difficulty=request.difficulty,
            count=count,
        )
        return QuizGenerateResponse(
            success=True,
            topic=topic,
            difficulty=request.difficulty,
            questions=questions,
            count=len(questions),
        )
    except ValueError as ve:
        raise HTTPException(status_code=503, detail=f"AI service configuration error: {str(ve)}")
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=f"Quiz generation failed: {str(re)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error generating quiz: {str(e)}")


@router.get("/health")
def quiz_health():
    return {"status": "ok", "endpoint": "/api/quiz/generate"}
