from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password


def get_user_by_email(
    db: Session,
    email: str
):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


def get_user_by_id(
    db: Session,
    user_id: int
):
    return (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )


def get_all_users(
    db: Session
):
    return (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )


def create_user(
    db: Session,
    user: UserCreate
):
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role="student"
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def update_user_status(
    db: Session,
    user_id: int,
    is_active: bool
):
    user = get_user_by_id(
        db,
        user_id
    )

    if not user:
        return None

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user