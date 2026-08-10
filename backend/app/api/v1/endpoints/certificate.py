from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.models.question import Question

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"],
)


def get_passed_attempt(
    db: Session,
    attempt_id: int,
    current_user: User,
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id,
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found.",
        )

    quiz = attempt.quiz

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz information not found.",
        )

    questions = (
        db.query(Question)
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.id.asc())
        .all()
    )

    total_marks = sum(
        question.marks or 0
        for question in questions
    )

    if total_marks <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quiz total marks are not configured correctly.",
        )

    score = 0

    for question in questions:
        answer = (
            db.query(Answer)
            .filter(
                Answer.attempt_id == attempt.id,
                Answer.question_id == question.id,
            )
            .first()
        )

        if not answer:
            continue

        selected_answer = (
            answer.selected_answer or ""
        ).strip().upper()

        correct_answer = (
            question.correct_answer or ""
        ).strip().upper()

        if (
            selected_answer
            and selected_answer == correct_answer
        ):
            score += question.marks or 0

    attempt.score = score

    percentage = round(
        (score / total_marks) * 100,
        2,
    )

    passing_percentage = float(
        quiz.passing_percentage or 0
    )

    db.commit()
    db.refresh(attempt)

    if percentage < passing_percentage:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Certificate not available.",
                "reason": "You have not passed the quiz.",
                "score": score,
                "total_marks": total_marks,
                "percentage": percentage,
                "required_percentage": passing_percentage,
            },
        )

    return (
        attempt,
        quiz,
        score,
        total_marks,
        percentage,
        passing_percentage,
    )


@router.get("")
def get_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == current_user.id
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .all()
    )

    certificates = []

    for attempt in attempts:
        quiz = attempt.quiz

        if not quiz:
            continue

        questions = (
            db.query(Question)
            .filter(
                Question.quiz_id == quiz.id
            )
            .order_by(Question.id.asc())
            .all()
        )

        total_marks = sum(
            question.marks or 0
            for question in questions
        )

        if total_marks <= 0:
            continue

        score = 0

        for question in questions:
            answer = (
                db.query(Answer)
                .filter(
                    Answer.attempt_id == attempt.id,
                    Answer.question_id == question.id,
                )
                .first()
            )

            if not answer:
                continue

            selected_answer = (
                answer.selected_answer or ""
            ).strip().upper()

            correct_answer = (
                question.correct_answer or ""
            ).strip().upper()

            if (
                selected_answer
                and selected_answer == correct_answer
            ):
                score += question.marks or 0

        percentage = round(
            (score / total_marks) * 100,
            2,
        )

        passing_percentage = float(
            quiz.passing_percentage or 0
        )

        if percentage >= passing_percentage:
            certificates.append(
                {
                    "attempt_id": attempt.id,
                    "quiz": {
                        "id": quiz.id,
                        "title": quiz.title,
                    },
                    "result": {
                        "score": score,
                        "total_marks": total_marks,
                        "percentage": percentage,
                        "passing_percentage": passing_percentage,
                    },
                    "date": (
                        attempt.created_at.strftime(
                            "%d %B %Y"
                        )
                        if attempt.created_at
                        else None
                    ),
                }
            )

    return {
        "certificate_available": len(certificates) > 0,
        "student": {
            "id": current_user.id,
            "name": current_user.full_name,
            "email": current_user.email,
        },
        "certificates": certificates,
    }


@router.get("/{attempt_id}")
def get_certificate(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    (
        attempt,
        quiz,
        score,
        total_marks,
        percentage,
        passing_percentage,
    ) = get_passed_attempt(
        db,
        attempt_id,
        current_user,
    )

    return {
        "certificate_available": True,
        "student": {
            "id": current_user.id,
            "name": current_user.full_name,
            "email": current_user.email,
        },
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
        },
        "result": {
            "score": score,
            "total_marks": total_marks,
            "percentage": percentage,
            "passing_percentage": passing_percentage,
        },
        "date": (
            attempt.created_at.strftime(
                "%d %B %Y"
            )
            if attempt.created_at
            else None
        ),
    }


@router.get("/{attempt_id}/download")
def download_certificate(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    (
        attempt,
        quiz,
        score,
        total_marks,
        percentage,
        passing_percentage,
    ) = get_passed_attempt(
        db,
        attempt_id,
        current_user,
    )

    template_path = (
        Path(__file__).resolve().parents[2]
        / "templates"
        / "certificate_template.pdf"
    )

    if not template_path.exists():
        template_path = (
            Path(__file__).resolve().parents[3]
            / "templates"
            / "certificate_template.pdf"
        )

    if not template_path.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                "Certificate template not found: "
                f"{template_path}"
            ),
        )

    try:
        template_reader = PdfReader(
            str(template_path)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read certificate template: {exc}",
        )

    if not template_reader.pages:
        raise HTTPException(
            status_code=500,
            detail="Certificate template does not contain any pages.",
        )

    template_page = template_reader.pages[0]

    page_width = float(
        template_page.mediabox.width
    )

    page_height = float(
        template_page.mediabox.height
    )

    overlay_buffer = BytesIO()

    pdf = canvas.Canvas(
        overlay_buffer,
        pagesize=(
            page_width,
            page_height,
        ),
    )

    student_name = (
        current_user.full_name or "Student"
    )

    quiz_title = (
        quiz.title or "Quiz"
    )

    date_text = (
        attempt.created_at.strftime(
            "%d %B %Y"
        )
        if attempt.created_at
        else ""
    )

    pdf.setFont(
        "Helvetica-Bold",
        12,
    )

    pdf.drawCentredString(
        435,
        324,
        student_name,
    )

    pdf.drawCentredString(
        435,
        306,
        quiz_title,
    )

    pdf.setFont(
        "Helvetica",
        10,
    )

    pdf.drawCentredString(
        340,
        284,
        date_text,
    )

    pdf.drawCentredString(
        565,
        284,
        f"{percentage}%",
    )

    pdf.showPage()
    pdf.save()

    overlay_buffer.seek(0)

    try:
        overlay_reader = PdfReader(
            overlay_buffer
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to create certificate overlay: {exc}",
        )

    overlay_page = overlay_reader.pages[0]

    template_page.merge_page(
        overlay_page
    )

    output_buffer = BytesIO()

    writer = PdfWriter()

    writer.add_page(
        template_page
    )

    writer.write(
        output_buffer
    )

    output_buffer.seek(0)

    filename = (
        f"certificate_"
        f"{current_user.id}_"
        f"{quiz.id}_"
        f"{attempt.id}.pdf"
    )

    return StreamingResponse(
        output_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )