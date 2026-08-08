from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_admin
from app.db.database import get_db
from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizResponse
from app.crud.quiz import (
    create_quiz,
    get_all_quizzes,
    get_quiz_by_id,
    update_quiz
)

router = APIRouter(
    prefix="/quizzes",
    tags=["Quizzes"]
)


@router.post("/", response_model=QuizResponse)
def add_quiz(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_quiz(db, quiz)


@router.get("/", response_model=list[QuizResponse])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_quizzes(db)


@router.put("/{quiz_id}", response_model=QuizResponse)
def edit_quiz(
    quiz_id: int,
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    existing_quiz = get_quiz_by_id(db, quiz_id)

    if not existing_quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    return update_quiz(db, quiz_id, quiz)