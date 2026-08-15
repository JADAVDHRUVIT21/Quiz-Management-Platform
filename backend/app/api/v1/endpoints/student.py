from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.database import get_db
from app.models.user import User

router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


@router.get("/")
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    students = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.id.desc())
        .all()
    )

    return {
        "total_students": len(students),
        "students": [
            {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email,
                "role": student.role,
                "is_active": student.is_active,
                "created_at": student.created_at
            }
            for student in students
        ]
    }