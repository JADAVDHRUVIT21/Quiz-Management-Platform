from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.answer import Answer
from app.models.question import Question
from app.schemas.quiz_attempt import QuizAttemptCreate


def create_quiz_attempt(
    db: Session,
    user_id: int,
    quiz_attempt: QuizAttemptCreate,
):
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
        score=0,
    )

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    return db_attempt


def get_my_attempts(
    db: Session,
    user_id: int,
):
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.created_at.desc())
        .all()
    )


def _build_quiz_result(
    db: Session,
    attempt: QuizAttempt,
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == attempt.quiz_id)
        .first()
    )

    if not quiz:
        return None

    questions = (
        db.query(Question)
        .filter(Question.quiz_id == attempt.quiz_id)
        .order_by(Question.id.asc())
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(Answer.attempt_id == attempt.id)
        .order_by(Answer.id.asc())
        .all()
    )

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

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

        is_unanswered = selected_answer is None

        is_correct = (
            not is_unanswered
            and selected_answer == correct_answer
        )

        if is_unanswered:
            unanswered += 1
            status = "unanswered"
        elif is_correct:
            correct_answers += 1
            score += question.marks or 0
            status = "correct"
        else:
            incorrect_answers += 1
            status = "incorrect"

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
                "status": status,
            }
        )

    attempt.score = score

    if total_marks > 0:
        percentage = round(
            (score / total_marks) * 100,
            2,
        )
    else:
        percentage = 0

    passing_percentage = float(
        quiz.passing_percentage or 0
    )

    result = (
        "PASS"
        if percentage >= passing_percentage
        else "FAIL"
    )

    db.commit()
    db.refresh(attempt)

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
        "passing_percentage": passing_percentage,
        "result": result,
        "questions": question_reviews,
    }


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
        .filter(Quiz.id == attempt.quiz_id)
        .first()
    )

    if not quiz:
        return None

    questions = (
        db.query(Question)
        .filter(Question.quiz_id == attempt.quiz_id)
        .order_by(Question.id.asc())
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(Answer.attempt_id == attempt.id)
        .order_by(Answer.id.asc())
        .all()
    )

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

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

        if selected_answer is None:
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
        "passing_percentage": float(
            quiz.passing_percentage or 0
        ),
        "questions": review,
    }