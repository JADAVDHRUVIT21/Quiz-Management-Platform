from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    duration: int = Field(gt=0)
    total_marks: int = Field(default=0, ge=0)
    passing_percentage: int = Field(default=50, ge=0, le=100)
    is_active: bool = True

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Title cannot be empty")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None):
        if value is not None:
            value = value.strip()

        return value


class QuizResponse(BaseModel):
    id: int
    title: str
    description: str | None
    duration: int
    total_marks: int
    passing_percentage: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    quiz_id: int = Field(gt=0)
    question_text: str = Field(min_length=1)
    option_a: str = Field(min_length=1)
    option_b: str = Field(min_length=1)
    option_c: str = Field(min_length=1)
    option_d: str = Field(min_length=1)
    correct_answer: str
    marks: int = Field(default=1, gt=0)

    @field_validator(
        "question_text",
        "option_a",
        "option_b",
        "option_c",
        "option_d"
    )
    @classmethod
    def validate_text(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty")

        return value

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(cls, value: str):
        value = value.strip().upper()

        if value not in {"A", "B", "C", "D"}:
            raise ValueError(
                "correct_answer must be A, B, C, or D"
            )

        return value


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

