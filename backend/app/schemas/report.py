"""
Report Schemas — dashboard KPIs, chart data responses.
"""

from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    """Admin/Manager dashboard KPI cards."""
    total_projects: int
    active_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_expenses: Decimal
    pending_expenses: int
    approved_expenses: Decimal
    total_employees: int


class TaskStatusSummary(BaseModel):
    """Tasks grouped by status for bar/pie charts."""
    status: str
    count: int


class ExpenseCategorySummary(BaseModel):
    """Expenses grouped by category for pie chart."""
    category: str
    total_amount: Decimal


class ResourceUtilization(BaseModel):
    """Estimated vs actual hours per employee."""
    employee_name: str
    estimated_hours: Decimal
    actual_hours: Decimal


class BurnRateData(BaseModel):
    """Project budget burn rate."""
    project_name: str
    total_budget: Decimal
    total_spent: Decimal
    remaining: Decimal
    burn_percentage: Decimal


class DashboardResponse(BaseModel):
    """Full dashboard response."""
    kpis: DashboardKPIs
    task_status_summary: List[TaskStatusSummary]
    expense_category_summary: List[ExpenseCategorySummary]
    recent_expenses: List["ExpenseResponse"] = []

    model_config = {"from_attributes": True}


# Import for forward reference
from app.schemas.expense import ExpenseResponse
