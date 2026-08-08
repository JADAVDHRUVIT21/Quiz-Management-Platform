from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.utils.security import get_current_user

from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

from io import BytesIO
from pathlib import Path


router = APIRouter(
    prefix="/certificate",
    tags=["Certificate"]
)


def get_passed_attempt(
    db: Session,
    current_user: User
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == current_user.id
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="You have not attempted any quiz yet."
        )

    quiz = attempt.quiz

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz information not found."
        )

    if quiz.total_marks <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quiz total marks are not configured correctly."
        )

    percentage = (
        attempt.score / quiz.total_marks
    ) * 100

    percentage = round(percentage, 2)

    if percentage < quiz.passing_percentage:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Certificate not available.",
                "reason": "You have not passed the quiz.",
                "score": attempt.score,
                "total_marks": quiz.total_marks,
                "percentage": percentage,
                "required_percentage": quiz.passing_percentage
            }
        )

    return attempt, quiz, percentage


@router.get("")
def get_certificate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt, quiz, percentage = get_passed_attempt(
        db,
        current_user
    )

    return {
        "certificate_available": True,
        "student": {
            "id": current_user.id,
            "name": current_user.full_name,
            "email": current_user.email
        },
        "quiz": {
            "id": quiz.id,
            "title": quiz.title
        },
        "result": {
            "score": attempt.score,
            "total_marks": quiz.total_marks,
            "percentage": percentage,
            "passing_percentage": quiz.passing_percentage
        },
        "date": (
            attempt.created_at.strftime("%d %B %Y")
            if attempt.created_at
            else None
        )
    }


@router.get("/download")
def download_certificate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt, quiz, percentage = get_passed_attempt(
        db,
        current_user
    )

    template_path = (
        Path(__file__).resolve().parents[1]
        / "templates"
        / "certificate_template.pdf"
    )

    if not template_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Certificate template not found: {template_path}"
        )

    template_reader = PdfReader(
        str(template_path)
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
            page_height
        )
    )

    pdf.setFont(
        "Helvetica-Bold",
        12
    )

    pdf.drawCentredString(
        435,
        324,
        current_user.full_name
    )

    pdf.drawCentredString(
        435,
        306,
        quiz.title
    )

    date_text = (
        attempt.created_at.strftime("%d %B %Y")
        if attempt.created_at
        else ""
    )

    pdf.setFont(
        "Helvetica",
        10
    )

    pdf.drawCentredString(
        340,
        284,
        date_text
    )

    pdf.drawCentredString(
        565,
        284,
        f"{percentage}%"
    )

    pdf.showPage()
    pdf.save()

    overlay_buffer.seek(0)

    overlay_reader = PdfReader(
        overlay_buffer
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
        f"{quiz.id}.pdf"
    )

    return StreamingResponse(
        output_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        }
    )