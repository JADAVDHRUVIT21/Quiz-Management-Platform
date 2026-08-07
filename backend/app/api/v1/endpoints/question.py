from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionResponse
from app.crud.question import (
    create_question,
    get_all_questions,
    get_questions_by_quiz,
)

router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
)


@router.post("/", response_model=QuestionResponse)
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_question(db, question)


@router.get("/", response_model=list[QuestionResponse])
def list_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_questions(db)


@router.get("/quiz/{quiz_id}", response_model=list[QuestionResponse])
def list_questions_by_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_questions_by_quiz(db, quiz_id)