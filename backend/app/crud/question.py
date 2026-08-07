from sqlalchemy.orm import Session

from app.models.question import Question
from app.schemas.question import QuestionCreate


def create_question(db: Session, question: QuestionCreate):
    db_question = Question(
        quiz_id=question.quiz_id,
        question_text=question.question_text,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_answer=question.correct_answer,
        marks=question.marks
    )

    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    return db_question


def get_all_questions(db: Session):
    return db.query(Question).all()


def get_questions_by_quiz(db: Session, quiz_id: int):
    return (
        db.query(Question)
        .filter(Question.quiz_id == quiz_id)
        .all()
    )


def get_question_by_id(db: Session, question_id: int):
    return (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )