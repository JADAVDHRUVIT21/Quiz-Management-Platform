from datetime import datetime

from pydantic import BaseModel, Field


class QuizAttemptCreate(BaseModel):
    quiz_id: int = Field(gt=0)


class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    score: int
    total_marks: int
    correct_answers: int
    incorrect_answers: int
    unanswered: int
    total_questions: int
    percentage: float
    result: str