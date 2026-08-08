from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.answer import Answer
from app.models.question import Question
from app.schemas.quiz_attempt import QuizAttemptCreate


def create_quiz_attempt(
    db: Session,
    user_id: int,
    quiz_attempt: QuizAttemptCreate
):
    # Check that the quiz exists
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_attempt.quiz_id)
        .first()
    )

    if not quiz:
        return None

    db_attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz_attempt.quiz_id,
        score=0
    )

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    return db_attempt


def get_my_attempts(
    db: Session,
    user_id: int
):
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .all()
    )


def get_quiz_result(
    db: Session,
    attempt_id: int,
    user_id: int
):
    # Find the attempt belonging to the logged-in user
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == user_id
        )
        .first()
    )

    if not attempt:
        return None

    # Find quiz
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == attempt.quiz_id)
        .first()
    )

    if not quiz:
        return None

    # Get all questions for this quiz
    questions = (
        db.query(Question)
        .filter(Question.quiz_id == attempt.quiz_id)
        .all()
    )

    # Get answers submitted for this attempt
    answers = (
        db.query(Answer)
        .filter(Answer.attempt_id == attempt.id)
        .all()
    )

    # Calculate correct answers
    correct_answers = 0

    for answer in answers:
        question = next(
            (
                q for q in questions
                if q.id == answer.question_id
            ),
            None
        )

        if question:
            if (
                answer.selected_answer.strip().upper()
                == question.correct_answer.strip().upper()
            ):
                correct_answers += 1

    total_questions = len(questions)

    # Total marks of the quiz
    total_marks = sum(
        question.marks for question in questions
    )

    # Calculate percentage
    if total_marks > 0:
        percentage = (attempt.score / total_marks) * 100
    else:
        percentage = 0

    # Pass if percentage is 40% or more
    result = "PASS" if percentage >= 40 else "FAIL"

    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "quiz_title": quiz.title,
        "score": attempt.score,
        "total_marks": total_marks,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "percentage": round(percentage, 2),
        "result": result
    }