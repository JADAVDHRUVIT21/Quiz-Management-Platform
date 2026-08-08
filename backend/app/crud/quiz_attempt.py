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
        .filter(
            QuizAttempt.user_id == user_id
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .all()
    )


def submit_quiz_attempt(
    db: Session,
    attempt_id: int,
    user_id: int
):
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
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(
            Answer.attempt_id == attempt.id
        )
        .all()
    )

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    total_questions = len(questions)

    total_marks = sum(
        question.marks
        for question in questions
    )

    correct_answers = 0
    incorrect_answers = 0
    unanswered = 0
    score = 0

    for question in questions:
        answer = answer_map.get(question.id)

        if not answer:
            unanswered += 1
            continue

        selected_answer = (
            answer.selected_answer or ""
        ).strip().upper()

        correct_answer = (
            question.correct_answer or ""
        ).strip().upper()

        if not selected_answer:
            unanswered += 1

        elif selected_answer == correct_answer:
            correct_answers += 1
            score += question.marks

        else:
            incorrect_answers += 1

    attempt.score = score

    db.commit()
    db.refresh(attempt)

    if total_marks > 0:
        percentage = (
            score / total_marks
        ) * 100
    else:
        percentage = 0

    result = (
        "PASS"
        if percentage >= quiz.passing_percentage
        else "FAIL"
    )

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
        "percentage": round(percentage, 2),
        "result": result
    }


def get_quiz_result(
    db: Session,
    attempt_id: int,
    user_id: int
):
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
        .all()
    )

    answers = (
        db.query(Answer)
        .filter(
            Answer.attempt_id == attempt.id
        )
        .all()
    )

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    total_questions = len(questions)

    total_marks = sum(
        question.marks
        for question in questions
    )

    correct_answers = 0
    incorrect_answers = 0
    unanswered = 0
    score = 0

    for question in questions:
        answer = answer_map.get(question.id)

        if not answer:
            unanswered += 1
            continue

        selected_answer = (
            answer.selected_answer or ""
        ).strip().upper()

        correct_answer = (
            question.correct_answer or ""
        ).strip().upper()

        if not selected_answer:
            unanswered += 1

        elif selected_answer == correct_answer:
            correct_answers += 1
            score += question.marks

        else:
            incorrect_answers += 1

    attempt.score = score

    db.commit()
    db.refresh(attempt)

    if total_marks > 0:
        percentage = (
            score / total_marks
        ) * 100
    else:
        percentage = 0

    result = (
        "PASS"
        if percentage >= quiz.passing_percentage
        else "FAIL"
    )

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
        "percentage": round(percentage, 2),
        "result": result
    }