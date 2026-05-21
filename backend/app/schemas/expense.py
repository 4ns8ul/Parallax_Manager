"""
Expense Schemas — submission, approval, and listing.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field


EXPENSE_CATEGORIES = [
    "TRAVEL", "MEALS", "ACCOMMODATION", "SOFTWARE", "HARDWARE",
    "OFFICE_SUPPLIES", "TRAINING", "COMMUNICATION", "MISCELLANEOUS"
]


class ExpenseCreate(BaseModel):
    """Submit expense — amount must be > 0, enforced here and at DB level."""
    task_id: Optional[int] = Field(None, gt=0)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=2000)


class ExpenseUpdate(BaseModel):
    """Update expense — only allowed while status is SUBMITTED."""
    task_id: Optional[int] = Field(None, gt=0)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)


class ExpenseApproval(BaseModel):
    """Approve or reject an expense."""
    action: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    rejection_reason: Optional[str] = Field(None, max_length=500)


class ExpenseResponse(BaseModel):
    """Expense response with employee and approver info."""
    id: int
    employee_id: int
    employee_name: str = ""
    task_id: Optional[int] = None
    task_title: Optional[str] = None
    amount: Decimal
    currency: str
    category: str
    description: str
    status: str
    bill_image_url: Optional[str] = None
    approved_by: Optional[int] = None
    approver_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseListResponse(BaseModel):
    """Paginated expense list."""
    expenses: List[ExpenseResponse]
    total: int
    page: int
    page_size: int
