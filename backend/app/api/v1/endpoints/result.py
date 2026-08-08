from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt

router = APIRouter(
    prefix="/results",
    tags=["Quiz Results"]
)


@router.get("/{attempt_id}")
def get_quiz_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found"
        )

    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "user_id": attempt.user_id,
        "score": attempt.score,
        "created_at": attempt.created_at
    }