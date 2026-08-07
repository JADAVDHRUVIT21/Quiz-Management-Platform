from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)

    description = Column(Text, nullable=True)

    duration = Column(Integer, nullable=False)

    total_marks = Column(Integer, nullable=False, default=0)

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    questions = relationship(
        "Question",
        back_populates="quiz",
        cascade="all, delete"
    )

    quiz_attempts = relationship(
        "QuizAttempt",
        back_populates="quiz",
        cascade="all, delete"
    )