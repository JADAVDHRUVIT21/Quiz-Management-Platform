from sqlalchemy.orm import Session

from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate


def create_quiz(db: Session, quiz: QuizCreate):
    db_quiz = Quiz(
        title=quiz.title,
        description=quiz.description,
        duration=quiz.duration,
        total_marks=quiz.total_marks
    )

    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)

    return db_quiz


def get_all_quizzes(db: Session):
    return db.query(Quiz).all()


def get_quiz_by_id(db: Session, quiz_id: int):
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()