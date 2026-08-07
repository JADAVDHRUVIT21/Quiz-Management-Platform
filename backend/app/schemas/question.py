from pydantic import BaseModel
from datetime import datetime


class QuestionCreate(BaseModel):
    quiz_id: int
    question_text: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str

    correct_answer: str

    marks: int = 1


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int

    question_text: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str

    correct_answer: str

    marks: int

    created_at: datetime

    class Config:
        from_attributes = True