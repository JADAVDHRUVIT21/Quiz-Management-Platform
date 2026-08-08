from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt


router = APIRouter(
    prefix="/certificate",
    tags=["Certificate"],
)


# ============================================================
# GET PASSED QUIZ ATTEMPT
# ============================================================

def get_passed_attempt(
    db: Session,
    attempt_id: int,
    current_user: User,
):
    """
    Get a specific quiz attempt belonging to the logged-in user
    and verify that the user has passed the quiz.
    """

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

    # Make sure the quiz has valid total marks.
    if quiz.total_marks <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quiz total marks are not configured correctly.",
        )

    # Calculate percentage from the actual attempt score.
    percentage = (
        attempt.score / quiz.total_marks
    ) * 100

    percentage = round(
        percentage,
        2,
    )

    # Check whether the student passed.
    if percentage < quiz.passing_percentage:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Certificate not available.",
                "reason": "You have not passed the quiz.",
                "score": attempt.score,
                "total_marks": quiz.total_marks,
                "percentage": percentage,
                "required_percentage": quiz.passing_percentage,
            },
        )

    return attempt, quiz, percentage


# ============================================================
# GET CERTIFICATE INFORMATION
# ============================================================

@router.get("/{attempt_id}")
def get_certificate(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return certificate information for a passed quiz attempt.
    """

    attempt, quiz, percentage = get_passed_attempt(
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
            "score": attempt.score,
            "total_marks": quiz.total_marks,
            "percentage": percentage,
            "passing_percentage": quiz.passing_percentage,
        },

        "date": (
            attempt.created_at.strftime("%d %B %Y")
            if attempt.created_at
            else None
        ),
    }


# ============================================================
# DOWNLOAD CERTIFICATE
# ============================================================

@router.get("/{attempt_id}/download")
def download_certificate(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download the existing certificate template with the
    student's information written onto it.

    IMPORTANT:
    We are NOT creating a new certificate design.

    Existing template:
        backend/app/templates/certificate_template.pdf

    We only add:
        - Student name
        - Quiz title
        - Completion date
        - Percentage
    """

    # --------------------------------------------------------
    # Verify passed attempt
    # --------------------------------------------------------

    attempt, quiz, percentage = get_passed_attempt(
        db,
        attempt_id,
        current_user,
    )

    # --------------------------------------------------------
    # Locate existing certificate template
    # --------------------------------------------------------

    template_path = (
        Path(__file__).resolve().parents[1]
        / "templates"
        / "certificate_template.pdf"
    )

    print(
        f"Certificate template path: {template_path}"
    )

    if not template_path.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                "Certificate template not found. "
                f"Expected location: {template_path}"
            ),
        )

    # --------------------------------------------------------
    # Read existing certificate PDF
    # --------------------------------------------------------

    try:
        template_reader = PdfReader(
            str(template_path)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to read certificate template: "
                f"{str(exc)}"
            ),
        )

    if not template_reader.pages:
        raise HTTPException(
            status_code=500,
            detail="Certificate template does not contain any pages.",
        )

    template_page = template_reader.pages[0]

    # --------------------------------------------------------
    # Get template dimensions
    # --------------------------------------------------------

    page_width = float(
        template_page.mediabox.width
    )

    page_height = float(
        template_page.mediabox.height
    )

    # --------------------------------------------------------
    # Create transparent overlay
    #
    # This is NOT a new certificate.
    # It is only text that will be placed over the
    # existing certificate template.
    # --------------------------------------------------------

    overlay_buffer = BytesIO()

    pdf = canvas.Canvas(
        overlay_buffer,
        pagesize=(
            page_width,
            page_height,
        ),
    )

    # --------------------------------------------------------
    # STUDENT NAME
    # --------------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        12,
    )

    pdf.drawCentredString(
        435,
        324,
        current_user.full_name or "Student",
    )

    # --------------------------------------------------------
    # QUIZ TITLE
    # --------------------------------------------------------

    pdf.drawCentredString(
        435,
        306,
        quiz.title or "Quiz",
    )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    date_text = (
        attempt.created_at.strftime(
            "%d %B %Y"
        )
        if attempt.created_at
        else ""
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

    # --------------------------------------------------------
    # PERCENTAGE
    # --------------------------------------------------------

    pdf.drawCentredString(
        565,
        284,
        f"{percentage}%",
    )

    # --------------------------------------------------------
    # Finish overlay PDF
    # --------------------------------------------------------

    pdf.showPage()
    pdf.save()

    overlay_buffer.seek(0)

    # --------------------------------------------------------
    # Read overlay
    # --------------------------------------------------------

    try:
        overlay_reader = PdfReader(
            overlay_buffer
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create certificate overlay: "
                f"{str(exc)}"
            ),
        )

    overlay_page = overlay_reader.pages[0]

    # --------------------------------------------------------
    # Merge overlay with EXISTING certificate
    # --------------------------------------------------------

    template_page.merge_page(
        overlay_page
    )

    # --------------------------------------------------------
    # Create final PDF
    # --------------------------------------------------------

    output_buffer = BytesIO()

    writer = PdfWriter()

    writer.add_page(
        template_page
    )

    writer.write(
        output_buffer
    )

    output_buffer.seek(0)

    # --------------------------------------------------------
    # Download filename
    # --------------------------------------------------------

    filename = (
        f"certificate_"
        f"{current_user.id}_"
        f"{quiz.id}_"
        f"{attempt.id}.pdf"
    )

    # --------------------------------------------------------
    # Return PDF
    # --------------------------------------------------------

    return StreamingResponse(
        output_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )