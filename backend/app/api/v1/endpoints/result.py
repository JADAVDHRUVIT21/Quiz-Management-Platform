from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User

from app.crud.quiz_attempt import (
    get_quiz_result,
    get_quiz_review,
)

from app.schemas.quiz_attempt import (
    QuizResultResponse,
    QuizReviewResponse,
)


router = APIRouter(
    prefix="/results",
    tags=["Quiz Results"],
)


# ============================================================
# GET RESULT
# GET /api/v1/results/{attempt_id}
# ============================================================

@router.get(
    "/{attempt_id}",
    response_model=QuizResultResponse,
)
def get_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_quiz_result(
        db=db,
        attempt_id=attempt_id,
        user_id=current_user.id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz result not found",
        )

    return result


# ============================================================
# GET REVIEW
# GET /api/v1/results/{attempt_id}/review
# ============================================================

@router.get(
    "/{attempt_id}/review",
    response_model=QuizReviewResponse,
)
def get_review(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_quiz_review(
        db=db,
        attempt_id=attempt_id,
        user_id=current_user.id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz review not found",
        )

    return result