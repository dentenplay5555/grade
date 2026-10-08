import os
import psutil
from fastapi import APIRouter, Depends
from app.auth.permissions import require_admin
from app.schemas.user import UserSessionInfo
from app.services.queue_service import queue_service

router = APIRouter(prefix="/system", tags=["Admin System"])

@router.get("/status")
def get_system_status(admin: UserSessionInfo = Depends(require_admin)):
    """System health check, queue status, and resource usage on Termux host."""
    queue_len = queue_service.get_queue_length()
    
    cpu_percent = 0.0
    mem_info = {"total": 0, "available": 0, "percent": 0.0}
    try:
        cpu_percent = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        mem_info = {
            "total_mb": round(mem.total / (1024 * 1024), 2),
            "available_mb": round(mem.available / (1024 * 1024), 2),
            "percent": mem.percent
        }
    except Exception:
        pass

    return {
        "status": "healthy",
        "queue_length": queue_len,
        "cpu_usage_percent": cpu_percent,
        "memory": mem_info,
    }
