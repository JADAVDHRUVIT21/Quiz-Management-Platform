from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_admin
from app.db.database import get_db
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionResponse
from app.crud.question import create_question, get_questions_by_quiz


router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
)


# Admin only - Create a question
@router.post("/", response_model=QuestionResponse)
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_question(db, question)


# Logged-in users - Get questions for a quiz
@router.get("/quiz/{quiz_id}", response_model=list[QuestionResponse])
def list_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_questions_by_quiz(db, quiz_id)