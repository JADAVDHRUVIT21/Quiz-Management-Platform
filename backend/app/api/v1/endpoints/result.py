from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz

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


@router.get("/")
def get_all_quiz_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = str(getattr(current_user, "role", "")).lower()

    if role == "admin":
        attempts = (
            db.query(QuizAttempt)
            .order_by(QuizAttempt.created_at.desc())
            .all()
        )
    else:
        attempts = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == current_user.id)
            .order_by(QuizAttempt.created_at.desc())
            .all()
        )

    results = []

    for attempt in attempts:
        quiz = (
            db.query(Quiz)
            .filter(Quiz.id == attempt.quiz_id)
            .first()
        )

        student = (
            db.query(User)
            .filter(User.id == attempt.user_id)
            .first()
        )

        total_marks = (
            float(quiz.total_marks)
            if quiz and quiz.total_marks is not None
            else 0
        )

        score = (
            float(attempt.score)
            if attempt.score is not None
            else 0
        )

        percentage = (
            round((score / total_marks) * 100, 2)
            if total_marks > 0
            else 0
        )

        passing_percentage = (
            float(quiz.passing_percentage)
            if quiz and quiz.passing_percentage is not None
            else 50
        )

        passed = percentage >= passing_percentage

        results.append(
            {
                "id": attempt.id,
                "attempt_id": attempt.id,
                "user_id": attempt.user_id,
                "student_id": attempt.user_id,
                "student_name": (
                    getattr(student, "full_name", None)
                    or getattr(student, "name", None)
                    or "Unknown Student"
                ),
                "student_email": (
                    getattr(student, "email", None)
                    or ""
                ),
                "quiz_id": attempt.quiz_id,
                "quiz_title": (
                    quiz.title
                    if quiz
                    else "Unknown Quiz"
                ),
                "score": score,
                "total_marks": total_marks,
                "percentage": percentage,
                "passing_percentage": passing_percentage,
                "result": "PASS" if passed else "FAIL",
                "status": "PASS" if passed else "FAIL",
                "created_at": attempt.created_at,
            }
        )

    return results


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