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
    update_quiz,
    delete_quiz,
)

router = APIRouter(
    prefix="/quizzes",
    tags=["Quizzes"],
)


@router.post("/", response_model=QuizResponse)
def add_quiz(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return create_quiz(db, quiz)


@router.get("/", response_model=list[QuizResponse])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_quizzes(db)


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_by_id(db, quiz_id)

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    return quiz


@router.put("/{quiz_id}", response_model=QuizResponse)
def edit_quiz(
    quiz_id: int,
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    existing_quiz = get_quiz_by_id(db, quiz_id)

    if not existing_quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    result = update_quiz(
        db,
        quiz_id,
        quiz,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    return result


@router.patch("/{quiz_id}/close", response_model=QuizResponse)
def close_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    quiz = get_quiz_by_id(db, quiz_id)

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    quiz.is_active = False

    db.commit()
    db.refresh(quiz)

    return quiz


@router.patch("/{quiz_id}/open", response_model=QuizResponse)
def open_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    quiz = get_quiz_by_id(db, quiz_id)

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    quiz.is_active = True

    db.commit()
    db.refresh(quiz)

    return quiz


@router.delete("/{quiz_id}")
def remove_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    existing_quiz = get_quiz_by_id(db, quiz_id)

    if not existing_quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    delete_quiz(
        db,
        quiz_id,
    )

    return {
        "message": "Quiz deleted successfully",
    }