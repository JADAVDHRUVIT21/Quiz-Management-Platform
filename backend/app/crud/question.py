from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.quiz import Quiz
from app.schemas.question import QuestionCreate


def create_question(
    db: Session,
    question: QuestionCreate
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == question.quiz_id)
        .first()
    )

    if not quiz:
        return None

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


def get_questions_by_quiz(
    db: Session,
    quiz_id: int
):
    return (
        db.query(Question)
        .filter(Question.quiz_id == quiz_id)
        .all()
    )


def get_question_by_id(
    db: Session,
    question_id: int
):
    return (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )


def update_question(
    db: Session,
    question_id: int,
    question_data: QuestionCreate
):
    db_question = get_question_by_id(
        db,
        question_id
    )

    if not db_question:
        return None

    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == question_data.quiz_id)
        .first()
    )

    if not quiz:
        return None

    db_question.quiz_id = question_data.quiz_id
    db_question.question_text = question_data.question_text
    db_question.option_a = question_data.option_a
    db_question.option_b = question_data.option_b
    db_question.option_c = question_data.option_c
    db_question.option_d = question_data.option_d
    db_question.correct_answer = question_data.correct_answer
    db_question.marks = question_data.marks

    db.commit()
    db.refresh(db_question)

    return db_question


def delete_question(
    db: Session,
    question_id: int
):
    db_question = get_question_by_id(
        db,
        question_id
    )

    if not db_question:
        return None

    db.delete(db_question)
    db.commit()

    return db_question