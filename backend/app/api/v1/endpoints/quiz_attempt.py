from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
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


@router.get("/", response_model=list[QuizAttemptResponse])
def my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_attempts(
        db,
        current_user.id
    )