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
        .filter(
            QuizAttempt.user_id == user_id
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .all()
    )


def _get_attempt_for_user(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    return (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == user_id,
        )
        .first()
    )


def _get_quiz(
    db: Session,
    quiz_id: int,
):
    return (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id
        )
        .first()
    )


def _get_questions(
    db: Session,
    quiz_id: int,
):
    return (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz_id
        )
        .order_by(
            Question.id.asc()
        )
        .all()
    )


def _get_answers(
    db: Session,
    attempt_id: int,
):
    return (
        db.query(Answer)
        .filter(
            Answer.attempt_id == attempt_id
        )
        .order_by(
            Answer.id.asc()
        )
        .all()
    )


def _normalize_answer(value):
    if value is None:
        return None

    value = str(value).strip().upper()

    return value if value else None


def _build_question_review(
    questions,
    answers,
):
    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    review = []

    correct_answers = 0
    incorrect_answers = 0
    unanswered = 0
    score = 0

    for index, question in enumerate(questions):
        answer = answer_map.get(question.id)

        selected_answer = None

        if answer:
            selected_answer = _normalize_answer(
                answer.selected_answer
            )

        correct_answer = _normalize_answer(
            question.correct_answer
        )

        marks = int(question.marks or 0)

        if selected_answer is None:
            status = "unanswered"
            is_correct = False
            is_unanswered = True
            unanswered += 1

        elif selected_answer == correct_answer:
            status = "correct"
            is_correct = True
            is_unanswered = False
            correct_answers += 1
            score += marks

        else:
            status = "incorrect"
            is_correct = False
            is_unanswered = False
            incorrect_answers += 1

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
                "marks": marks,
                "is_correct": is_correct,
                "is_unanswered": is_unanswered,
                "status": status,
            }
        )

    return (
        review,
        correct_answers,
        incorrect_answers,
        unanswered,
        score,
    )


def _build_quiz_result(
    db: Session,
    attempt: QuizAttempt,
):
    quiz = _get_quiz(
        db=db,
        quiz_id=attempt.quiz_id,
    )

    if not quiz:
        return None

    questions = _get_questions(
        db=db,
        quiz_id=quiz.id,
    )

    answers = _get_answers(
        db=db,
        attempt_id=attempt.id,
    )

    (
        question_reviews,
        correct_answers,
        incorrect_answers,
        unanswered,
        calculated_score,
    ) = _build_question_review(
        questions=questions,
        answers=answers,
    )

    calculated_total_marks = sum(
        int(question.marks or 0)
        for question in questions
    )

    if calculated_total_marks > 0:
        total_marks = calculated_total_marks
    else:
        total_marks = int(
            quiz.total_marks or 0
        )

    if total_marks > 0:
        percentage = round(
            (
                float(calculated_score)
                / float(total_marks)
            )
            * 100,
            2,
        )
    else:
        percentage = 0.0

    passing_percentage = float(
        quiz.passing_percentage
        if quiz.passing_percentage is not None
        else 50
    )

    total_questions = len(questions)

    if total_questions == 0:
        result = "NO_QUESTIONS"
        status = "NO_QUESTIONS"

    elif total_marks <= 0:
        result = "NO_MARKS"
        status = "NO_MARKS"

    elif percentage >= passing_percentage:
        result = "PASS"
        status = "COMPLETED"

    else:
        result = "FAIL"
        status = "COMPLETED"

    if attempt.score != calculated_score:
        attempt.score = calculated_score
        db.commit()
        db.refresh(attempt)

    return {
        "id": attempt.id,
        "attempt_id": attempt.id,
        "user_id": attempt.user_id,
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "score": calculated_score,
        "total_marks": total_marks,
        "correct_answers": correct_answers,
        "incorrect_answers": incorrect_answers,
        "unanswered": unanswered,
        "total_questions": total_questions,
        "percentage": percentage,
        "passing_percentage": passing_percentage,
        "result": result,
        "status": status,
        "created_at": attempt.created_at,
        "questions": question_reviews,
    }


def submit_quiz_attempt(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    attempt = _get_attempt_for_user(
        db=db,
        attempt_id=attempt_id,
        user_id=user_id,
    )

    if not attempt:
        return None

    return _build_quiz_result(
        db=db,
        attempt=attempt,
    )


def get_quiz_result(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    attempt = _get_attempt_for_user(
        db=db,
        attempt_id=attempt_id,
        user_id=user_id,
    )

    if not attempt:
        return None

    return _build_quiz_result(
        db=db,
        attempt=attempt,
    )


def get_quiz_review(
    db: Session,
    attempt_id: int,
    user_id: int,
):
    attempt = _get_attempt_for_user(
        db=db,
        attempt_id=attempt_id,
        user_id=user_id,
    )

    if not attempt:
        return None

    quiz = _get_quiz(
        db=db,
        quiz_id=attempt.quiz_id,
    )

    if not quiz:
        return None

    questions = _get_questions(
        db=db,
        quiz_id=quiz.id,
    )

    answers = _get_answers(
        db=db,
        attempt_id=attempt.id,
    )

    (
        review,
        correct_answers,
        incorrect_answers,
        unanswered,
        score,
    ) = _build_question_review(
        questions=questions,
        answers=answers,
    )

    total_marks = sum(
        int(question.marks or 0)
        for question in questions
    )

    if total_marks <= 0:
        total_marks = int(
            quiz.total_marks or 0
        )

    if total_marks > 0:
        percentage = round(
            (
                float(score)
                / float(total_marks)
            )
            * 100,
            2,
        )
    else:
        percentage = 0.0

    passing_percentage = float(
        quiz.passing_percentage
        if quiz.passing_percentage is not None
        else 50
    )

    if len(questions) == 0:
        result = "NO_QUESTIONS"
    elif total_marks <= 0:
        result = "NO_MARKS"
    elif percentage >= passing_percentage:
        result = "PASS"
    else:
        result = "FAIL"

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "score": score,
        "total_marks": total_marks,
        "correct_answers": correct_answers,
        "incorrect_answers": incorrect_answers,
        "unanswered": unanswered,
        "total_questions": len(questions),
        "percentage": percentage,
        "passing_percentage": passing_percentage,
        "result": result,
        "questions": review,
    }