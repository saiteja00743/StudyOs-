import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional

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

@router.post("/stream")
async def stream_chat_message(request: ChatRequest):
    history_dicts = [
        {"role": msg.role, "content": msg.content}
        for msg in (request.history or [])
    ]
    
    async def event_generator():
        async for chunk in gemini_service.generate_chat_stream(
            prompt=request.message,
            subject=request.subject_focus,
            history=history_dicts
        ):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/plain")


# ── File analysis endpoint (image + PDF) ──────────────────────────────────────
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_PDF_TYPE    = "application/pdf"
MAX_IMAGE_BYTES     = 4 * 1024 * 1024   # 4 MB
MAX_PDF_BYTES       = 20 * 1024 * 1024  # 20 MB

@router.post("/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    message: str = Form(default=""),
    subject_focus: str = Form(default="general"),
):
    """
    Accept an uploaded image or PDF and stream an AI analysis response.
    - Images  → Groq vision model (llama-3.2-11b-vision-preview)
    - PDFs    → pypdf text extraction → llama-3.3-70b-versatile
    """
    content_type = (file.content_type or "").lower()
    file_bytes   = await file.read()

    # ── Image ──────────────────────────────────────────────────────────────────
    if content_type in ALLOWED_IMAGE_TYPES:
        if len(file_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image too large (max 4 MB).")

        async def image_stream():
            async for chunk in gemini_service.analyze_image(
                image_bytes=file_bytes,
                mime_type=content_type,
                question=message,
                subject=subject_focus,
            ):
                yield chunk

        return StreamingResponse(image_stream(), media_type="text/plain")

    # ── PDF ────────────────────────────────────────────────────────────────────
    elif content_type == ALLOWED_PDF_TYPE or file.filename.lower().endswith(".pdf"):
        if len(file_bytes) > MAX_PDF_BYTES:
            raise HTTPException(status_code=413, detail="PDF too large (max 20 MB).")

        async def pdf_stream():
            async for chunk in gemini_service.analyze_pdf_content(
                pdf_bytes=file_bytes,
                question=message,
                subject=subject_focus,
            ):
                yield chunk

        return StreamingResponse(pdf_stream(), media_type="text/plain")

    else:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Please upload an image (JPG/PNG/WEBP) or PDF."
        )
