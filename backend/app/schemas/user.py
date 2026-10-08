from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    display_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT
    created_at: Optional[datetime] = None

class UserSessionInfo(BaseModel):
    user_id: str
    email: EmailStr
    role: UserRole
