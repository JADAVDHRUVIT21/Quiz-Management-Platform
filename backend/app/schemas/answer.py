from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class AnswerCreate(BaseModel):
    attempt_id: int = Field(gt=0)
    question_id: int = Field(gt=0)
    selected_answer: str

    @field_validator("selected_answer")
    @classmethod
    def validate_selected_answer(cls, value: str):
        value = value.strip().upper()

        if value not in {"A", "B", "C", "D"}:
            raise ValueError(
                "selected_answer must be A, B, C, or D"
            )

        return value


class AnswerResponse(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    selected_answer: str
    created_at: datetime

    class Config:
        from_attributes = True