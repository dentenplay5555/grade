from fastapi import Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.schemas.user import UserSessionInfo, UserRole

def require_admin(
    user: UserSessionInfo = Depends(get_current_user)
) -> UserSessionInfo:
    """
    Dependency that ensures the authenticated user has ADMIN role.
    Rejects with HTTP 403 Forbidden otherwise.
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required."
        )
    return user
