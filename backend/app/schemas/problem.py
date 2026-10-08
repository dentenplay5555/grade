from pydantic import BaseModel, Field
from typing import Optional, List

class ProblemBase(BaseModel):
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=100)
    time_limit_ms: int = Field(default=1000, ge=100, le=10000)
    memory_limit_mb: int = Field(default=128, ge=16, le=512)
    score: int = Field(default=100, ge=0)
    is_active: bool = True

class ProblemSummary(ProblemBase):
    id: str

class ProblemDetail(ProblemSummary):
    statement: str
    sample_inputs: Optional[List[str]] = []
    sample_outputs: Optional[List[str]] = []

class ProblemCreate(ProblemBase):
    statement: str
    sample_inputs: Optional[List[str]] = []
    sample_outputs: Optional[List[str]] = []

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    statement: Optional[str] = None
    time_limit_ms: Optional[int] = None
    memory_limit_mb: Optional[int] = None
    score: Optional[int] = None
    is_active: Optional[bool] = None
