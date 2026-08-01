from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

SubjectFocusType = Literal['general', 'math_science', 'coding', 'humanities', 'exam_prep']

class ChatMessagePayload(BaseModel):
    id: str
    role: Literal['user', 'assistant', 'system']
    content: str
    timestamp: str
    subject_focus: Optional[SubjectFocusType] = 'general'

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    subject_focus: SubjectFocusType = 'general'
    history: Optional[List[ChatMessagePayload]] = Field(default_factory=list)
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    message_id: str
    session_id: str
    content: str
    subject_focus: SubjectFocusType
    timestamp: str

class SuggestedQuestion(BaseModel):
    id: str
    category: str
    question: str
    prompt: str
    icon: str

class ChatSessionMeta(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    subject_focus: SubjectFocusType
