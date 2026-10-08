from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.jwt import decode_supabase_jwt
from app.schemas.user import UserSessionInfo, UserRole
from app.db.supabase import get_supabase_admin_client

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> UserSessionInfo:
    """
    FastAPI dependency that extracts and validates the JWT from Authorization header.
    Resolves user profile and role.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials
    try:
        payload = decode_supabase_jwt(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    email = payload.get("email") or ""
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
        )
        
    # Fetch role and metadata from Supabase user_metadata or app_metadata
    user_metadata = payload.get("user_metadata", {})
    app_metadata = payload.get("app_metadata", {})
    role_str = app_metadata.get("role") or user_metadata.get("role", "student")
    
    role = UserRole.ADMIN if role_str == "admin" else UserRole.STUDENT
    name = user_metadata.get("full_name") or user_metadata.get("name") or (email.split("@")[0] if email else "User")
    avatar = user_metadata.get("avatar_url") or ""
    
    return UserSessionInfo(
        user_id=user_id,
        email=email,
        role=role,
        name=name,
        avatar=avatar,
        isAdmin=(role == UserRole.ADMIN)
    )
