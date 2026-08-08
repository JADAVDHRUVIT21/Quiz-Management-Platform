from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.crud.quiz_attempt import get_quiz_result
from app.schemas.quiz_attempt import QuizResultResponse


router = APIRouter(
    prefix="/results",
    tags=["Quiz Results"]
)


@router.get(
    "/{attempt_id}",
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