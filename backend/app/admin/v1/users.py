from fastapi import APIRouter, Depends
from app.auth.permissions import require_admin
from app.schemas.user import UserSessionInfo
from app.db.supabase import get_supabase_admin_client

router = APIRouter(prefix="/users", tags=["Admin Users"])

@router.get("")
def list_users(admin: UserSessionInfo = Depends(require_admin)):
    """List all registered users."""
    try:
        db = get_supabase_admin_client()
        res = db.table("profiles").select("*").execute()
        return res.data
    except Exception:
        return []
