from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    attempt_id = Column(
        Integer,
        ForeignKey(
            "quiz_attempts.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    question_id = Column(
        Integer,
        ForeignKey(
            "questions.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    selected_answer = Column(
        String(1),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    attempt = relationship(
        "QuizAttempt",
        back_populates="answers"
    )

    question = relationship(
        "Question",
        back_populates="answers"
    )