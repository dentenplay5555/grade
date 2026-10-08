from fastapi import APIRouter, Depends
from typing import List
from app.auth.permissions import require_admin
from app.schemas.user import UserSessionInfo
from app.db.supabase import get_supabase_admin_client

router = APIRouter(prefix="/submissions", tags=["Admin Submissions"])

@router.get("")
def list_all_submissions(admin: UserSessionInfo = Depends(require_admin)):
    """Admin view of all submissions across all users."""
    try:
        db = get_supabase_admin_client()
        res = db.table("submissions").select("*").order("created_at", desc=True).limit(100).execute()
        return res.data
    except Exception as e:
        return []
