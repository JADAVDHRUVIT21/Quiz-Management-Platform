from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/quizzes",
    tags=["Quizzes"]
)


@router.get("/")
def get_all_quizzes(
    current_user: User = Depends(get_current_user)
):
    return {
        "message": f"Welcome {current_user.full_name}",
        "email": current_user.email,
        "role": current_user.role,
        "data": []
    }