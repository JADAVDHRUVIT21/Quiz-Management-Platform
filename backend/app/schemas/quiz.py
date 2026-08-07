from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int
    total_marks: int


class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    duration: int
    total_marks: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True