from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int
    total_marks: int
    passing_percentage: int = 50


class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    duration: int
    total_marks: int
    passing_percentage: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True