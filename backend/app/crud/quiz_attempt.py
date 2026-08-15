from sqlalchemy.orm import Session
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.answer import Answer
from app.models.question import Question
from app.schemas.quiz_attempt import QuizAttemptCreate


# CREATE QUIZ ATTEMPT

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

# GET MY ATTEMPTS

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

# BUILD QUIZ RESULT

def _build_quiz_result(
    db: Session,
    attempt: QuizAttempt,
):

    # Get quiz
    
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == attempt.quiz_id
        )
        .first()
    )

    if not quiz:
        return None
    
    # Get all questions
    
    questions = (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz.id
        )
        .order_by(
            Question.id.asc()
        )
        .all()
    )

    # Get submitted answers

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
    
    # Map answers by question ID

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }


    # Calculate totals
    
    total_questions = len(questions)

    # Calculate total marks from actual questions.
    # If questions exist, this is more reliable than relying
    # only on quizzes.total_marks.
    calculated_total_marks = sum(
        int(question.marks or 0)
        for question in questions
    )
    # Use calculated marks when available.
    # Otherwise fall back to quiz.total_marks.
    if calculated_total_marks > 0:
        total_marks = calculated_total_marks
    else:
        total_marks = int(
            quiz.total_marks or 0
        )
    
    # Initialize counters
    
    correct_answers = 0
    incorrect_answers = 0
    unanswered = 0
    score = 0

    question_reviews = []

    # Evaluate every question
    
    for index, question in enumerate(questions):

        answer = answer_map.get(
            question.id
        )

        # Selected answer
    
        selected_answer = None

        if answer:
            selected_answer = (
                answer.selected_answer or ""
            ).strip().upper()

            if selected_answer == "":
                selected_answer = None

        # Correct answer
    
        correct_answer = (
            question.correct_answer or ""
        ).strip().upper()

        # Determine status

        if selected_answer is None:

            is_unanswered = True
            is_correct = False

            unanswered += 1

            status = "unanswered"

        elif selected_answer == correct_answer:

            is_unanswered = False
            is_correct = True

            correct_answers += 1

            score += int(
                question.marks or 0
            )

            status = "correct"

        else:

            is_unanswered = False
            is_correct = False

            incorrect_answers += 1

            status = "incorrect"
            
        # Question review
        
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
                "marks": int(
                    question.marks or 0
                ),
                "is_correct": is_correct,
                "is_unanswered": is_unanswered,
                "status": status,
            }
        )

    # Calculate percentage
    
    if total_marks > 0:

        percentage = round(
            (
                float(score)
                / float(total_marks)
            ) * 100,
            2,
        )

    else:

        percentage = 0.0
    
    # Passing percentage

    passing_percentage = float(
        quiz.passing_percentage or 0
    )

    # Determine result
    
    if total_questions == 0:

        result = "NO_QUESTIONS"

    elif total_marks <= 0:

        result = "NO_MARKS"

    elif percentage >= passing_percentage:

        result = "PASS"

    else:

        result = "FAIL"

    # Save calculated score

    attempt.score = score

    db.commit()
    db.refresh(attempt)
    
    # Return complete result

    return {
        "attempt_id": attempt.id,

        "quiz_id": quiz.id,

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

        "status": (
            "COMPLETED"
            if total_questions > 0
            else "NO_QUESTIONS"
        ),

        "created_at": attempt.created_at,

        "questions": question_reviews,
    }

# SUBMIT QUIZ ATTEMPT

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
        db=db,
        attempt=attempt,
    )

# GET QUIZ RESULT

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
        db=db,
        attempt=attempt,
    )


# GET QUIZ REVIEW

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
            Question.quiz_id == quiz.id
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

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    review = []

    for index, question in enumerate(questions):

        answer = answer_map.get(
            question.id
        )

        selected_answer = None

        if answer:
            selected_answer = (
                answer.selected_answer or ""
            ).strip().upper()

            if selected_answer == "":
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

                "marks": int(
                    question.marks or 0
                ),

                "status": status,
            }
        )

    return {
        "attempt_id": attempt.id,

        "quiz_id": quiz.id,

        "quiz_title": quiz.title,

        "passing_percentage": float(
            quiz.passing_percentage or 0
        ),

        "questions": review,
    }