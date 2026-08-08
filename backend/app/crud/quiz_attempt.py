from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.answer import Answer
from app.models.question import Question

from app.schemas.quiz_attempt import QuizAttemptCreate


# ============================================================
# CREATE QUIZ ATTEMPT
# ============================================================

def create_quiz_attempt(
    db: Session,
    user_id: int,
    quiz_attempt: QuizAttemptCreate,
):
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_attempt.quiz_id
        )
        .first()
    )

    if not quiz:
        return None

    db_attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz_attempt.quiz_id,
        score=0,
    )

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    return db_attempt


# ============================================================
# GET MY ATTEMPTS
# ============================================================

def get_my_attempts(
    db: Session,
    user_id: int,
):
    return (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == user_id
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .all()
    )


# ============================================================
# BUILD QUIZ RESULT
# ============================================================

def _build_quiz_result(
    db: Session,
    attempt: QuizAttempt,
):
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == attempt.quiz_id
        )
        .first()
    )

    if not quiz:
        return None

    questions = (
        db.query(Question)
        .filter(
            Question.quiz_id == attempt.quiz_id
        )
        .order_by(
            Question.id.asc()
        )
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(
            Answer.attempt_id == attempt.id
        )
        .order_by(
            Answer.id.asc()
        )
        .all()
    )

    answer_map = {}

    for answer in answers:
        answer_map[answer.question_id] = answer

    total_questions = len(questions)

    total_marks = sum(
        question.marks or 0
        for question in questions
    )

    correct_answers = 0
    incorrect_answers = 0
    unanswered = 0
    score = 0

    question_reviews = []

    for index, question in enumerate(questions):

        answer = answer_map.get(question.id)

        selected_answer = None

        if answer:
            selected_answer = (
                answer.selected_answer or ""
            ).strip().upper()

            if not selected_answer:
                selected_answer = None

        correct_answer = (
            question.correct_answer or ""
        ).strip().upper()

        is_unanswered = not selected_answer

        is_correct = (
            not is_unanswered
            and selected_answer == correct_answer
        )

        if is_unanswered:

            unanswered += 1

        elif is_correct:

            correct_answers += 1

            score += question.marks or 0

        else:

            incorrect_answers += 1

        question_reviews.append(
            {
                "question_id": question.id,
                "question_number": index + 1,
                "question_text": question.question_text,

                "option_a": question.option_a,
                "option_b": question.option_b,
                "option_c": question.option_c,
                "option_d": question.option_d,

                "selected_answer": selected_answer,
                "correct_answer": correct_answer,

                "marks": question.marks or 0,

                "is_correct": is_correct,
                "is_unanswered": is_unanswered,
            }
        )

    # Save score
    attempt.score = score

    db.commit()
    db.refresh(attempt)

    if total_marks > 0:

        percentage = (
            score / total_marks
        ) * 100

    else:

        percentage = 0

    percentage = round(
        percentage,
        2,
    )

    passing_percentage = (
        quiz.passing_percentage or 0
    )

    if percentage >= passing_percentage:

        result = "PASS"

    else:

        result = "FAIL"

    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "quiz_title": quiz.title,

        "score": score,
        "total_marks": total_marks,

        "correct_answers": correct_answers,
        "incorrect_answers": incorrect_answers,
        "unanswered": unanswered,
        "total_questions": total_questions,

        "percentage": percentage,
        "result": result,

        "questions": question_reviews,
    }


# ============================================================
# SUBMIT QUIZ ATTEMPT
# ============================================================

def submit_quiz_attempt(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == user_id,
        )
        .first()
    )

    if not attempt:
        return None

    return _build_quiz_result(
        db,
        attempt,
    )


# ============================================================
# GET QUIZ RESULT
# ============================================================

def get_quiz_result(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == user_id,
        )
        .first()
    )

    if not attempt:
        return None

    return _build_quiz_result(
        db,
        attempt,
    )


# ============================================================
# GET QUIZ REVIEW
# ============================================================

def get_quiz_review(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == user_id,
        )
        .first()
    )

    if not attempt:
        return None

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == attempt.quiz_id
        )
        .first()
    )

    if not quiz:
        return None

    questions = (
        db.query(Question)
        .filter(
            Question.quiz_id == attempt.quiz_id
        )
        .order_by(
            Question.id.asc()
        )
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(
            Answer.attempt_id == attempt.id
        )
        .order_by(
            Answer.id.asc()
        )
        .all()
    )

    answer_map = {}

    for answer in answers:
        answer_map[answer.question_id] = answer

    review = []

    for index, question in enumerate(questions):

        answer = answer_map.get(question.id)

        selected_answer = None

        if answer:
            selected_answer = (
                answer.selected_answer or ""
            ).strip().upper()

            if not selected_answer:
                selected_answer = None

        correct_answer = (
            question.correct_answer or ""
        ).strip().upper()

        if not selected_answer:

            status = "unanswered"

        elif selected_answer == correct_answer:

            status = "correct"

        else:

            status = "incorrect"

        review.append(
            {
                "question_id": question.id,
                "question_number": index + 1,
                "question_text": question.question_text,

                "option_a": question.option_a,
                "option_b": question.option_b,
                "option_c": question.option_c,
                "option_d": question.option_d,

                "selected_answer": selected_answer,
                "correct_answer": correct_answer,

                "marks": question.marks or 0,

                "status": status,
            }
        )

    return {
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "quiz_title": quiz.title,
        "questions": review,
    }