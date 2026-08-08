from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.models.question import Question
from app.models.quiz_attempt import QuizAttempt
from app.schemas.answer import AnswerCreate


def create_answer(
    db: Session,
    answer: AnswerCreate
):
    # Find question
    question = (
        db.query(Question)
        .filter(Question.id == answer.question_id)
        .first()
    )

    if not question:
        return None

    # Find attempt
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == answer.attempt_id)
        .first()
    )

    if not attempt:
        return None

    # Make sure the question belongs to the same quiz
    if question.quiz_id != attempt.quiz_id:
        return None

    # Check if question was already answered
    existing_answer = (
        db.query(Answer)
        .filter(
            Answer.attempt_id == answer.attempt_id,
            Answer.question_id == answer.question_id
        )
        .first()
    )

    if existing_answer:
        return existing_answer

    # Normalize selected answer
    selected_answer = answer.selected_answer.strip().upper()

    # Create answer
    db_answer = Answer(
        attempt_id=answer.attempt_id,
        question_id=answer.question_id,
        selected_answer=selected_answer
    )

    db.add(db_answer)

    # Add marks if correct
    if selected_answer == question.correct_answer.strip().upper():
        attempt.score = (attempt.score or 0) + question.marks

    db.commit()
    db.refresh(db_answer)

    return db_answer