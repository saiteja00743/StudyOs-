import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/pdf", tags=["PDF Intelligence"])

class PDFProcessResponse(BaseModel):
    document_id: str
    name: str
    page_count: int
    summary: str
    key_points: List[str]
    suggested_quiz_topics: List[str]

@router.post("/upload", response_model=PDFProcessResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF/DOCX/TXT document.
    In production, reads text, chunks it, and sends to Gemini for analysis.
    """
    allowed_types = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)

    if file_size_mb > 50:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")

    # In production: extract text → chunk → send to Gemini
    # For now, return an AI-mock response
    from app.services.gemini_service import gemini_service

    mock_prompt = f"Summarize a document titled '{file.filename}' with key academic content."
    summary = await gemini_service.generate_chat_response(
        prompt=mock_prompt,
        subject="general"
    )

    return PDFProcessResponse(
        document_id=str(uuid.uuid4()),
        name=file.filename or "document.pdf",
        page_count=max(1, len(contents) // 3000),
        summary=summary[:600],
        key_points=[
            "Core theoretical framework introduced in early sections",
            "Methodology and analytical approach used throughout",
            "Empirical evidence and data supporting the main argument",
            "Practical applications and case study analysis",
            "Conclusions and recommendations for further study",
        ],
        suggested_quiz_topics=["Key definitions", "Core concepts", "Applications", "Analysis"]
    )
