from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_admin
from app.db.database import get_db
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionResponse
from app.crud.question import (
    create_question,
    get_questions_by_quiz,
    get_question_by_id,
    update_question,
    delete_question
)


router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
)


@router.post("/", response_model=QuestionResponse)
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = create_question(db, question)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    return result


@router.get(
    "/quiz/{quiz_id}",
    response_model=list[QuestionResponse]
)
def list_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_questions_by_quiz(db, quiz_id)


@router.put(
    "/{question_id}",
    response_model=QuestionResponse
)
def edit_question(
    question_id: int,
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    existing_question = get_question_by_id(
        db,
        question_id
    )

    if not existing_question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    result = update_question(
        db,
        question_id,
        question
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    return result


@router.delete("/{question_id}")
def remove_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    existing_question = get_question_by_id(
        db,
        question_id
    )

    if not existing_question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    delete_question(
        db,
        question_id
    )

    return {
        "message": "Question deleted successfully"
    }