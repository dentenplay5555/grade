from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.schemas.user import UserSessionInfo, UserProfile

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserSessionInfo)
def get_my_profile(user: UserSessionInfo = Depends(get_current_user)):
    """Return the authenticated user's profile and role."""
    return user
