from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.schemas.quiz_attempt import QuizAttemptCreate


def create_quiz_attempt(
    db: Session,
    user_id: int,
    quiz_attempt: QuizAttemptCreate
):
    db_attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz_attempt.quiz_id,
        score=0
    )

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    return db_attempt


def get_my_attempts(
    db: Session,
    user_id: int
):
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .all()
    )