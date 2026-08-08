from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.answer import (
    AnswerCreate,
    AnswerResponse
)
from app.crud.answer import create_answer


router = APIRouter(
    prefix="/answers",
    tags=["Answers"]
)


@router.post(
    "/",
    response_model=AnswerResponse
)
def submit_answer(
    answer: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = create_answer(
        db,
        answer
    )

    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid question, attempt, or answer"
        )

    if result.attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot submit an answer for this attempt"
        )

    return result