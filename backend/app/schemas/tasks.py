from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.schemas.users import UserSummary

class TaskBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: Optional[str] = "TO_DO"
    priority: Optional[str] = "MEDIUM"
    est_hours: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    actual_hours: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    due_date: Optional[date] = None

class TaskCreate(TaskBase):
    project_id: int
    assignee_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    est_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    due_date: Optional[date] = None

class TaskStatusUpdate(BaseModel):
    status: str

class TaskTimeLog(BaseModel):
    hours_to_add: Decimal = Field(..., gt=Decimal("0.00"))

class TaskOut(TaskBase):
    id: int
    project_id: int
    assignee_id: int
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)
