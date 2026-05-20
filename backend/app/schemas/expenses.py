from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.users import UserSummary

class ExpenseBase(BaseModel):
    project_id: int
    task_id: Optional[int] = None
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    currency: Optional[str] = "USD"
    category: str = Field(..., max_length=100)
    description: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ExpenseApproval(BaseModel):
    status: str  # APPROVED or REJECTED
    rejected_reason: Optional[str] = None

class ExpenseOut(ExpenseBase):
    id: int
    employee_id: int
    status: str
    bill_image_url: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    employee: Optional[UserSummary] = None
    approver: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)
