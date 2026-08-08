from pydantic import BaseModel
from datetime import datetime


class AnswerCreate(BaseModel):
    attempt_id: int
    question_id: int
    selected_answer: str


class AnswerResponse(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    selected_answer: str
    created_at: datetime

    class Config:
        from_attributes = True