from pydantic import BaseModel
from typing import List, Dict
from decimal import Decimal

class GanttTask(BaseModel):
    name: str
    startOffset: int  # Days since project start
    duration: int     # Est/Actual span days

class BurndownData(BaseModel):
    day: str
    idealRemaining: Decimal
    actualRemaining: Decimal

class ExpenseSegment(BaseModel):
    name: str  # Category
    value: Decimal  # Category total amount

class ResourceUtilization(BaseModel):
    employee: str
    allocated: Decimal  # Est hours
    completed: Decimal  # Actual logged hours

class DashboardSummary(BaseModel):
    total_projects: int
    active_tasks: int
    pending_expenses_count: int
    pending_expenses_amount: Decimal
    recent_notifications: List[Dict] = []
