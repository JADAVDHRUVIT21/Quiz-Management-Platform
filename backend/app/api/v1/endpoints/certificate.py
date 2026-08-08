from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.crud.quiz_attempt import get_quiz_result


router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)


@router.get("/{attempt_id}")
def download_certificate(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get quiz result
    result = get_quiz_result(
        db,
        attempt_id,
        current_user.id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Quiz result not found"
        )

    # Certificate is available only for passed quizzes
    if result["result"] != "PASS":
        raise HTTPException(
            status_code=403,
            detail="Certificate is available only after passing the quiz"
        )

    # Existing certificate template
    base_dir = Path(__file__).resolve().parents[3]

    certificate_path = (
        base_dir
        / "templates"
        / "certificate_template.pdf"
    )

    if not certificate_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Certificate template not found"
        )

    return FileResponse(
        path=str(certificate_path),
        media_type="application/pdf",
        filename=f"certificate-{attempt_id}.pdf"
    )