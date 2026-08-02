import uuid
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/pdf", tags=["PDF Intelligence"])


class PDFAnalyzeRequest(BaseModel):
    text: str
    filename: str
    max_key_points: Optional[int] = 8


class PDFAnalyzeResponse(BaseModel):
    document_id: str
    name: str
    page_count: int
    summary: str
    key_points: List[str]
    suggested_quiz_topics: List[str]


@router.post("/analyze", response_model=PDFAnalyzeResponse)
async def analyze_pdf_text(req: PDFAnalyzeRequest):
    """
    Accept extracted document text from the browser and use Gemini AI
    to produce a structured summary, key points, and quiz topics.
    """
    if not req.text or len(req.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Document text is too short for analysis.")

    # Truncate to ~12k chars to stay within free-tier limits
    text_snippet = req.text[:12000]
    max_kp = min(req.max_key_points or 8, 12)

    prompt = f"""Analyze the following document and respond ONLY with valid JSON.
Do not include any explanation before or after the JSON object.

Document Title: {req.filename}
Document Content:
---
{text_snippet}
---

Return this exact JSON structure:
{{
  "summary": "A comprehensive 3-5 sentence summary of the document in simple, clear language.",
  "key_points": ["Key point 1", "Key point 2", "...up to {max_kp} key points"],
  "suggested_quiz_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]
}}"""

    try:
        raw = await gemini_service.generate_chat_response(
            prompt=prompt,
            subject="general"
        )

        # Parse the JSON from Gemini's response
        # Strip any markdown code fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1]).strip()

        parsed = json.loads(cleaned)
        summary = parsed.get("summary", "")
        key_points = parsed.get("key_points", [])
        quiz_topics = parsed.get("suggested_quiz_topics", [])

        # Estimate page count from text length (~2500 chars per page)
        page_count = max(1, len(req.text) // 2500)

        return PDFAnalyzeResponse(
            document_id=str(uuid.uuid4()),
            name=req.filename,
            page_count=page_count,
            summary=summary,
            key_points=key_points[:max_kp],
            suggested_quiz_topics=quiz_topics,
        )

    except json.JSONDecodeError:
        # Gemini didn't return pure JSON — extract meaningful parts from raw text
        sentences = [s.strip() for s in raw.split(".") if len(s.strip()) > 20]
        summary = ". ".join(sentences[:4]) + "." if sentences else raw[:500]
        return PDFAnalyzeResponse(
            document_id=str(uuid.uuid4()),
            name=req.filename,
            page_count=max(1, len(req.text) // 2500),
            summary=summary,
            key_points=[
                "Core concepts and frameworks introduced",
                "Methodology and analytical approach",
                "Key findings and supporting evidence",
                "Practical applications and real-world relevance",
                "Conclusions and recommendations",
            ],
            suggested_quiz_topics=["Core Concepts", "Key Definitions", "Analysis", "Applications"],
        )
    except Exception as e:
        print(f"PDF analyze error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.post("/upload", response_model=PDFAnalyzeResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a TXT file directly. For PDFs, use /analyze with pre-extracted text.
    """
    allowed_types = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")

    # For text files, decode and analyze
    text = ""
    if file.content_type == "text/plain":
        text = contents.decode("utf-8", errors="ignore")
    else:
        text = f"Document: {file.filename}. Size: {len(contents)} bytes."

    req = PDFAnalyzeRequest(text=text, filename=file.filename or "document")
    return await analyze_pdf_text(req)
