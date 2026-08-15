from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.models.answer import Answer
from app.models.quiz import Quiz
from app.crud.quiz_attempt import get_quiz_result


router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


# ============================================================
# GET ALL STUDENTS
# ============================================================

@router.get("/")
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    students = (
        db.query(User)
        .filter(
            User.role == "student"
        )
        .order_by(
            User.id.desc()
        )
        .all()
    )

    return {
        "total_students": len(students),

        "students": [
            {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email,
                "role": student.role,
                "is_active": student.is_active,
                "created_at": student.created_at,
            }
            for student in students
        ],
    }


# ============================================================
# GET STUDENT DETAILS
# ============================================================

@router.get("/{student_id}")
def get_student_details(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # Find student
    # --------------------------------------------------------

    student = (
        db.query(User)
        .filter(
            User.id == student_id,
            User.role == "student",
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # --------------------------------------------------------
    # Get all attempts of this student
    # --------------------------------------------------------

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == student.id
        )
        .order_by(
            QuizAttempt.id.desc()
        )
        .all()
    )

    quiz_attempts = []

    total_completed = 0
    total_passed = 0
    total_failed = 0

    percentages = []

    # ========================================================
    # PROCESS EVERY ATTEMPT
    # ========================================================

    for attempt in attempts:

        # ----------------------------------------------------
        # Get quiz information directly
        # ----------------------------------------------------

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.id == attempt.quiz_id
            )
            .first()
        )

        # ----------------------------------------------------
        # Check whether this attempt has answers
        # ----------------------------------------------------

        answer_count = (
            db.query(Answer)
            .filter(
                Answer.attempt_id == attempt.id
            )
            .count()
        )

        # ----------------------------------------------------
        # Get calculated result
        # ----------------------------------------------------

        result = get_quiz_result(
            db=db,
            attempt_id=attempt.id,
            user_id=student.id,
        )

        # ====================================================
        # RESULT EXISTS
        # ====================================================

        if result:

            # ------------------------------------------------
            # IMPORTANT:
            # get_quiz_result() returns a DICTIONARY.
            # Therefore use result.get(), NOT getattr().
            # ------------------------------------------------

            quiz_id = result.get(
                "quiz_id",
                attempt.quiz_id,
            )

            quiz_title = result.get(
                "quiz_title"
            )

            # Fallback to actual Quiz table
            if not quiz_title and quiz:
                quiz_title = quiz.title

            if not quiz_title:
                quiz_title = "Unknown Quiz"

            score = result.get(
                "score",
                0,
            )

            total_marks = result.get(
                "total_marks",
                0,
            )

            percentage = result.get(
                "percentage",
                0,
            )

            passing_percentage = result.get(
                "passing_percentage",
                0,
            )

            result_status = str(
                result.get(
                    "result",
                    "",
                )
            ).upper()

            # ------------------------------------------------
            # Determine whether attempt is actually completed
            # ------------------------------------------------

            total_questions = result.get(
                "total_questions",
                0,
            )

            # If there are no questions, don't mark as normal
            # completed attempt.
            if total_questions == 0:

                status = "IN_PROGRESS"

                final_result = None

            # If answers exist, we have an actual submission/result.
            elif answer_count > 0:

                status = "PASS" if (
                    result_status == "PASS"
                ) else "FAIL"

                final_result = (
                    "PASS"
                    if result_status == "PASS"
                    else "FAIL"
                )

                total_completed += 1

                if final_result == "PASS":
                    total_passed += 1

                elif final_result == "FAIL":
                    total_failed += 1

                # Add percentage to average
                if percentage is not None:
                    percentages.append(
                        float(percentage)
                    )

            else:

                # Attempt exists but no answers were submitted.
                status = "IN_PROGRESS"

                final_result = None

            # ------------------------------------------------
            # Add attempt data
            # ------------------------------------------------

            quiz_attempts.append(
                {
                    "attempt_id": attempt.id,

                    "quiz_id": quiz_id,

                    "quiz_title": quiz_title,

                    "score": score,

                    "total_marks": total_marks,

                    "percentage": percentage,

                    "passing_percentage": passing_percentage,

                    "result": final_result,

                    "status": status,

                    "total_questions": total_questions,

                    "correct_answers": result.get(
                        "correct_answers",
                        0,
                    ),

                    "incorrect_answers": result.get(
                        "incorrect_answers",
                        0,
                    ),

                    "unanswered": result.get(
                        "unanswered",
                        0,
                    ),

                    "created_at": attempt.created_at,
                }
            )

        # ====================================================
        # RESULT DOES NOT EXIST
        # ====================================================

        else:

            quiz_title = (
                quiz.title
                if quiz
                else "Unknown Quiz"
            )

            quiz_attempts.append(
                {
                    "attempt_id": attempt.id,

                    "quiz_id": attempt.quiz_id,

                    "quiz_title": quiz_title,

                    "score": 0,

                    "total_marks": (
                        quiz.total_marks
                        if quiz
                        else 0
                    ),

                    "percentage": 0,

                    "passing_percentage": (
                        quiz.passing_percentage
                        if quiz
                        else 0
                    ),

                    "result": None,

                    "status": "IN_PROGRESS",

                    "total_questions": 0,

                    "correct_answers": 0,

                    "incorrect_answers": 0,

                    "unanswered": 0,

                    "created_at": attempt.created_at,
                }
            )

    # ========================================================
    # CALCULATE AVERAGE
    # ========================================================

    if percentages:

        average_percentage = round(
            sum(percentages)
            / len(percentages),
            2,
        )

    else:

        average_percentage = 0.0

    # ========================================================
    # RETURN STUDENT DETAILS
    # ========================================================

    return {
        "student": {
            "id": student.id,

            "full_name": student.full_name,

            "email": student.email,

            "role": student.role,

            "is_active": student.is_active,

            "created_at": student.created_at,
        },

        "statistics": {
            "total_attempts": len(attempts),

            "total_completed": total_completed,

            "total_passed": total_passed,

            "total_failed": total_failed,

            "average_percentage": average_percentage,
        },

        "attempts": quiz_attempts,
    }