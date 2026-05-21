"""
Task Schemas — CRUD operations and status transitions.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Create task — strict validation on all fields."""
    project_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="TO_DO", pattern="^(TO_DO|IN_PROGRESS|BLOCKED|DONE)$")
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")
    assignee_id: int = Field(..., gt=0)
    est_hours: Decimal = Field(..., ge=0)
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    """Update task — partial updates allowed."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(TO_DO|IN_PROGRESS|BLOCKED|DONE)$")
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH)$")
    assignee_id: Optional[int] = Field(None, gt=0)
    est_hours: Optional[Decimal] = Field(None, ge=0)
    actual_hours: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[date] = None


class TaskStatusUpdate(BaseModel):
    """Update task status only."""
    status: str = Field(..., pattern="^(TO_DO|IN_PROGRESS|BLOCKED|DONE)$")
    actual_hours: Optional[Decimal] = Field(None, ge=0)


class TaskResponse(BaseModel):
    """Task response with project and assignee info."""
    id: int
    project_id: int
    project_name: str = ""
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assignee_id: int
    assignee_name: str = ""
    est_hours: Decimal
    actual_hours: Decimal
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Paginated task list."""
    tasks: List[TaskResponse]
    total: int
    page: int
    page_size: int
