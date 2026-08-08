from sqlalchemy.orm import Session

from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate


def create_quiz(db: Session, quiz: QuizCreate):
    db_quiz = Quiz(
        title=quiz.title,
        description=quiz.description,
        duration=quiz.duration,
        total_marks=quiz.total_marks,
        passing_percentage=quiz.passing_percentage
    )

    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)

    return db_quiz


def get_all_quizzes(db: Session):
    return db.query(Quiz).all()


def get_quiz_by_id(db: Session, quiz_id: int):
    return (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )


def update_quiz(
    db: Session,
    quiz_id: int,
    quiz_data: QuizCreate
):
    db_quiz = get_quiz_by_id(db, quiz_id)

    if not db_quiz:
        return None

    db_quiz.title = quiz_data.title
    db_quiz.description = quiz_data.description
    db_quiz.duration = quiz_data.duration
    db_quiz.total_marks = quiz_data.total_marks
    db_quiz.passing_percentage = quiz_data.passing_percentage

    db.commit()
    db.refresh(db_quiz)

    return db_quiz

def delete_quiz(
    db: Session,
    quiz_id: int
):
    db_quiz = get_quiz_by_id(
        db,
        quiz_id
    )

    if not db_quiz:
        return None

    db.delete(db_quiz)
    db.commit()

    return db_quiz