from pydantic import BaseModel
from datetime import datetime


class QuizAttemptCreate(BaseModel):
    quiz_id: int


class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int
    created_at: datetime

    class Config:
        from_attributes = True