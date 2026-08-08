from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
)
from app.crud.quiz_attempt import (
    create_quiz_attempt,
    get_my_attempts,
)


router = APIRouter(
    prefix="/attempts",
    tags=["Quiz Attempts"]
)


# Logged-in users can start a quiz
@router.post("/", response_model=QuizAttemptResponse)
def start_quiz(
    quiz_attempt: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_quiz_attempt(
        db,
        current_user.id,
        quiz_attempt
    )


# Logged-in users can view their own attempts
@router.get("/", response_model=list[QuizAttemptResponse])
def my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_attempts(
        db,
        current_user.id
    )


# Logged-in users can submit their own quiz attempt
@router.post(
    "/{attempt_id}/submit",
    response_model=QuizAttemptResponse
)
def submit_quiz(
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

    return attempt