from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False
    )

    score = Column(
        Integer,
        default=0,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="quiz_attempts"
    )

    quiz = relationship(
        "Quiz",
        back_populates="quiz_attempts"
    )

    answers = relationship(
        "Answer",
        back_populates="attempt",
        cascade="all, delete"
    )