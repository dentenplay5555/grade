from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.problem import ProblemSummary, ProblemDetail
from app.services.problem_service import problem_service
from app.auth.dependencies import get_current_user
from app.schemas.user import UserSessionInfo

router = APIRouter(prefix="/problems", tags=["Problems"])

@router.get("", response_model=List[ProblemSummary])
def list_problems(user: UserSessionInfo = Depends(get_current_user)):
    """List all active coding problems."""
    return problem_service.list_problems()

@router.get("/{problem_id}", response_model=ProblemDetail)
def get_problem(problem_id: str, user: UserSessionInfo = Depends(get_current_user)):
    """Get problem statement, parameters, and sample testcases."""
    problem = problem_service.get_problem_detail(problem_id)
    if not problem or not problem.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem '{problem_id}' not found."
        )
    return problem
