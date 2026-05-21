"""
User Schemas — CRUD operations and role management.
All fields are strictly validated to prevent DevTools bypass attacks.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Create user request — all fields required, validated server-side."""
    email: EmailStr = Field(..., pattern=r".+@prlx\.com$", description="Must be a @prlx.com company email")
    personal_email: EmailStr = Field(..., description="Personal email to receive credentials")
    phone_number: Optional[str] = Field(None, description="Employee phone number")
    password: Optional[str] = Field(None, min_length=8, max_length=128, description="If empty, a temp password will be auto-generated")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role_ids: List[int] = Field(default_factory=list, description="Role IDs to assign")


class UserUpdate(BaseModel):
    """Update user request — partial updates allowed."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None)
    role_ids: Optional[List[int]] = Field(None, description="Role IDs to assign")
    status: Optional[str] = Field(None, pattern="^(ACTIVE|SUSPENDED|INACTIVE)$")


class UserRoleUpdate(BaseModel):
    """Update user roles."""
    role_ids: List[int] = Field(..., min_length=1)


class UserResponse(BaseModel):
    """User response — never exposes password_hash."""
    id: int
    email: str
    personal_email: Optional[str] = None
    phone_number: Optional[str] = None
    first_name: str
    last_name: str
    status: str
    must_change_password: bool = False
    roles: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Paginated user list."""
    users: List[UserResponse]
    total: int
    page: int
    page_size: int
