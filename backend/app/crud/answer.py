from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.models.question import Question
from app.models.quiz_attempt import QuizAttempt
from app.schemas.answer import AnswerCreate


def create_answer(
    db: Session,
    answer: AnswerCreate
):
    question = (
        db.query(Question)
        .filter(
            Question.id == answer.question_id
        )
        .first()
    )

    if not question:
        return None

    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == answer.attempt_id
        )
        .first()
    )

    if not attempt:
        return None

    if question.quiz_id != attempt.quiz_id:
        return None

    selected_answer = (
        answer.selected_answer
        .strip()
        .upper()
    )

    if selected_answer not in {"A", "B", "C", "D"}:
        return None

    existing_answer = (
        db.query(Answer)
        .filter(
            Answer.attempt_id == answer.attempt_id,
            Answer.question_id == answer.question_id
        )
        .first()
    )

    if existing_answer:
        existing_answer.selected_answer = selected_answer

        db.commit()
        db.refresh(existing_answer)

        return existing_answer

    db_answer = Answer(
        attempt_id=answer.attempt_id,
        question_id=answer.question_id,
        selected_answer=selected_answer
    )

    db.add(db_answer)

    db.commit()
    db.refresh(db_answer)

    return db_answer