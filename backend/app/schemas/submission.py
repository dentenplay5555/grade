from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class ProgrammingLanguage(str, Enum):
    CPP = "cpp"
    C = "c"
    PYTHON = "python"

class Verdict(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    COMPILING = "COMPILING"
    RUNNING = "RUNNING"
    ACCEPTED = "ACCEPTED"
    WRONG_ANSWER = "WRONG_ANSWER"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    COMPILATION_ERROR = "COMPILATION_ERROR"
    SYSTEM_ERROR = "SYSTEM_ERROR"

class TestCaseResult(BaseModel):
    test_case_index: int
    verdict: Verdict
    time_ms: int
    memory_kb: int
    score: int = 0
    error_message: Optional[str] = None

class SubmissionCreate(BaseModel):
    problem_id: str
    language: ProgrammingLanguage = ProgrammingLanguage.CPP
    source_code: str = Field(..., min_length=1, max_length=65536)

class SubmissionResponse(BaseModel):
    id: str
    user_id: str
    problem_id: str
    language: ProgrammingLanguage
    verdict: Verdict
    score: int = 0
    execution_time_ms: Optional[int] = None
    memory_used_kb: Optional[int] = None
    compile_error: Optional[str] = None
    created_at: datetime
    test_cases: Optional[List[TestCaseResult]] = []

class SubmissionQueuePayload(BaseModel):
    submission_id: str
    problem_id: str
    user_id: str
    language: ProgrammingLanguage
    source_code: str
    time_limit_ms: int
    memory_limit_mb: int
