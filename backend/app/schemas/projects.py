from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.users import UserSummary

class ProjectBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    status: Optional[str] = "PLANNING"
    total_budget: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))

class ProjectCreate(ProjectBase):
    manager_id: int

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    total_budget: Optional[Decimal] = None
    manager_id: Optional[int] = None

class ProjectOut(ProjectBase):
    id: int
    manager_id: int
    created_at: datetime
    updated_at: datetime
    manager: Optional[UserSummary] = None
    members: List[UserSummary] = []

    model_config = ConfigDict(from_attributes=True)

class ProjectAssignmentRequest(BaseModel):
    user_id: int
