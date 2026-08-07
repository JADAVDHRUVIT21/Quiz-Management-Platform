from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False
    )

    question_text = Column(Text, nullable=False)

    option_a = Column(String(255), nullable=False)

    option_b = Column(String(255), nullable=False)

    option_c = Column(String(255), nullable=False)

    option_d = Column(String(255), nullable=False)

    correct_answer = Column(String(1), nullable=False)

    marks = Column(Integer, default=1)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    quiz = relationship(
        "Quiz",
        back_populates="questions"
    )
    answers = relationship(
    "Answer",
    back_populates="question",
    cascade="all, delete"
    )