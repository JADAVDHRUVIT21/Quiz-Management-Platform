from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.crud.user import (
    get_all_users,
    get_user_by_id,
    update_user_status
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/",
    response_model=list[UserResponse]
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return get_all_users(db)


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.put(
    "/{user_id}/status",
    response_model=UserResponse
)
def change_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = update_user_status(
        db,
        user_id,
        is_active
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user