from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User

from app.crud.quiz_attempt import (
    create_quiz_attempt,
    get_my_attempts,
    get_quiz_result,
)

from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    QuizResultResponse,
)


router = APIRouter(
    prefix="/attempts",
    tags=["Quiz Attempts"],
)


# ============================================================
# CREATE / START QUIZ ATTEMPT
# POST /api/v1/attempts/
# ============================================================

@router.post(
    "/",
    response_model=QuizAttemptResponse,
)
def create_attempt(
    quiz_attempt: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = create_quiz_attempt(
        db=db,
        user_id=current_user.id,
        quiz_attempt=quiz_attempt,
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    return attempt


# ============================================================
# GET MY ATTEMPTS
# GET /api/v1/attempts/
# ============================================================

@router.get(
    "/",
    response_model=list[QuizAttemptResponse],
)
def get_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_attempts(
        db=db,
        user_id=current_user.id,
    )


# ============================================================
# GET SINGLE ATTEMPT
# GET /api/v1/attempts/{attempt_id}
# ============================================================

@router.get(
    "/{attempt_id}",
    response_model=QuizAttemptResponse,
)
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.quiz_attempt import QuizAttempt

    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id,
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found",
        )

    return attempt


# ============================================================
# SUBMIT QUIZ ATTEMPT
# POST /api/v1/attempts/{attempt_id}/submit
# ============================================================

@router.post(
    "/{attempt_id}/submit",
    response_model=QuizResultResponse,
)
def submit_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.crud.quiz_attempt import submit_quiz_attempt

    result = submit_quiz_attempt(
        db=db,
        attempt_id=attempt_id,
        user_id=current_user.id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found",
        )

    return result