from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
def list_songs(current_user: User = Depends(get_current_user)):
    return {
        "message": "You are authenticated",
        "user_id": current_user.id,
        "email": current_user.email,
    }
