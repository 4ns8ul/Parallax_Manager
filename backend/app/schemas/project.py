"""
Project Schemas — CRUD operations and member management.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """Create project — budget must be >= 0, enforced both here and at DB level."""
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    status: str = Field(default="PLANNING", pattern="^(PLANNING|ACTIVE|COMPLETED)$")
    manager_id: Optional[int] = Field(None, gt=0)
    total_budget: Decimal = Field(..., ge=0)


class ProjectUpdate(BaseModel):
    """Update project — partial updates allowed."""
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(PLANNING|ACTIVE|COMPLETED)$")
    manager_id: Optional[int] = Field(None, gt=0)
    total_budget: Optional[Decimal] = Field(None, ge=0)


class ProjectMemberAdd(BaseModel):
    """Add members to a project."""
    user_ids: List[int] = Field(..., min_length=1)


class ProjectResponse(BaseModel):
    """Project response with manager info."""
    id: int
    name: str
    description: Optional[str] = None
    status: str
    manager_id: int
    manager_name: str = ""
    total_budget: Decimal
    member_count: int = 0
    member_ids: List[int] = []
    task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Paginated project list."""
    projects: List[ProjectResponse]
    total: int
    page: int
    page_size: int
