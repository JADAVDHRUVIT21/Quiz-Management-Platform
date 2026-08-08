from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    QuizResultResponse
)
from app.crud.quiz_attempt import (
    create_quiz_attempt,
    get_my_attempts,
    submit_quiz_attempt,
    get_quiz_result
)


router = APIRouter(
    prefix="/attempts",
    tags=["Quiz Attempts"]
)


@router.post(
    "/",
    response_model=QuizAttemptResponse
)
def start_quiz(
    quiz_attempt: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = create_quiz_attempt(
        db,
        current_user.id,
        quiz_attempt
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    return attempt


@router.get(
    "/",
    response_model=list[QuizAttemptResponse]
)
def my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_my_attempts(
        db,
        current_user.id
    )


@router.post(
    "/{attempt_id}/submit",
    response_model=QuizResultResponse
)
def submit_quiz(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = submit_quiz_attempt(
        db,
        attempt_id,
        current_user.id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found"
        )

    return result


@router.get(
    "/{attempt_id}/result",
    response_model=QuizResultResponse
)
def get_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = get_quiz_result(
        db,
        attempt_id,
        current_user.id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz result not found"
        )

    return result