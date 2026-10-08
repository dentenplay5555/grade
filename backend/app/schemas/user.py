from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"

class UserRoleAssignment(BaseModel):
    roleId: str
    scopeType: str = "global"
    scopeId: Optional[str] = None

class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    avatar: str = ""
    status: str = "active"
    isAdmin: bool = False
    hasPasskey: bool = False
    hasTotp: bool = False
    createdAt: str
    roles: List[UserRoleAssignment] = []

class UserSessionInfo(BaseModel):
    user_id: str
    email: EmailStr
    role: UserRole
    name: str
    avatar: str = ""
    isAdmin: bool = False
