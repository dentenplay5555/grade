import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionResponse,
    SubmissionQueuePayload,
    Verdict
)
from app.schemas.user import UserSessionInfo
from app.services.problem_service import problem_service
from app.services.queue_service import queue_service
from app.db.supabase import get_supabase_admin_client
from app.config import settings

class SubmissionService:
    def create_submission(self, user: UserSessionInfo, data: SubmissionCreate) -> SubmissionResponse:
        # Validate problem exists
        problem = problem_service.get_problem_detail(data.problem_id)
        if not problem or not problem.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem '{data.problem_id}' does not exist or is inactive."
            )

        # Check payload size
        if len(data.source_code.encode("utf-8")) > settings.MAX_SOURCE_CODE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Source code exceeds maximum allowed size ({settings.MAX_SOURCE_CODE_BYTES} bytes)."
            )

        # Check concurrency
        active_jobs = queue_service.get_active_user_job_count(user.user_id)
        if active_jobs >= settings.MAX_CONCURRENT_JOBS_PER_USER:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many concurrent submissions. Please wait for your previous submission to finish."
            )

        submission_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc)

        # Save record in Supabase / Local storage
        # Note: If Supabase DB is connected, insert submission record
        try:
            admin_db = get_supabase_admin_client()
            admin_db.table("submissions").insert({
                "id": submission_id,
                "user_id": user.user_id,
                "problem_id": data.problem_id,
                "language": data.language.value,
                "verdict": Verdict.QUEUED.value,
                "score": 0,
                "source_code": data.source_code,
                "created_at": created_at.isoformat()
            }).execute()
        except Exception:
            # Fallback for offline/local standalone mode
            pass

        # Push to Redis Queue
        queue_payload = SubmissionQueuePayload(
            submission_id=submission_id,
            problem_id=data.problem_id,
            user_id=user.user_id,
            language=data.language,
            source_code=data.source_code,
            time_limit_ms=problem.time_limit_ms,
            memory_limit_mb=problem.memory_limit_mb
        )
        queue_service.enqueue_submission(queue_payload)

        return SubmissionResponse(
            id=submission_id,
            user_id=user.user_id,
            problem_id=data.problem_id,
            language=data.language,
            verdict=Verdict.QUEUED,
            score=0,
            created_at=created_at
        )

    def get_submission_detail(self, submission_id: str, user: UserSessionInfo) -> SubmissionResponse:
        try:
            admin_db = get_supabase_admin_client()
            query = admin_db.table("submissions").select("*").eq("id", submission_id)
            if user.role.value != "admin":
                query = query.eq("user_id", user.user_id)
            res = query.execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Submission not found.")
            row = res.data[0]
            return SubmissionResponse(
                id=row["id"],
                user_id=row["user_id"],
                problem_id=row["problem_id"],
                language=row["language"],
                verdict=row["verdict"],
                score=row.get("score", 0),
                execution_time_ms=row.get("execution_time_ms"),
                memory_used_kb=row.get("memory_used_kb"),
                compile_error=row.get("compile_error"),
                created_at=datetime.fromisoformat(row["created_at"])
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

submission_service = SubmissionService()
