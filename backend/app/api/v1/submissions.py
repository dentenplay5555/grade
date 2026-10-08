from fastapi import APIRouter, Depends, status
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.services.submission_service import submission_service
from app.auth.dependencies import get_current_user
from app.schemas.user import UserSessionInfo

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_code(
    data: SubmissionCreate,
    user: UserSessionInfo = Depends(get_current_user)
):
    """
    Submit source code for grading.
    Queues the submission and initiates asynchronous evaluation.
    """
    return submission_service.create_submission(user, data)

@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: str,
    user: UserSessionInfo = Depends(get_current_user)
):
    """Get status and result verdict of a submission."""
    return submission_service.get_submission_detail(submission_id, user)
