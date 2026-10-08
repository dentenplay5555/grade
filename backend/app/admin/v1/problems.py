from fastapi import APIRouter, Depends, status
from typing import List
from app.schemas.problem import ProblemDetail, ProblemCreate
from app.services.problem_service import problem_service
from app.auth.permissions import require_admin
from app.schemas.user import UserSessionInfo

router = APIRouter(prefix="/problems", tags=["Admin Problems"])

@router.post("/{problem_id}", response_model=ProblemDetail, status_code=status.HTTP_201_CREATED)
def create_or_update_problem(
    problem_id: str,
    data: ProblemCreate,
    admin: UserSessionInfo = Depends(require_admin)
):
    """Create or update a problem definition and limits."""
    return problem_service.create_problem(problem_id, data)
