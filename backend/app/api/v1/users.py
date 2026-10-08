from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.auth.dependencies import get_current_user
from app.schemas.user import UserSessionInfo, User, UserRoleAssignment

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=User)
def get_my_profile(session: UserSessionInfo = Depends(get_current_user)):
    """Return the authenticated user's profile and RBAC roles."""
    roles = [
        UserRoleAssignment(
            roleId="admin" if session.isAdmin else "student",
            scopeType="global"
        )
    ]
    
    return User(
        id=session.user_id,
        email=session.email,
        name=session.name,
        avatar=session.avatar,
        status="active",
        isAdmin=session.isAdmin,
        hasPasskey=False,
        hasTotp=False,
        createdAt=datetime.now(timezone.utc).isoformat(),
        roles=roles
    )
