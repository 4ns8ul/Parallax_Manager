"""Reports API routes — dashboard KPIs and chart data."""

from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.schemas.report import (
    DashboardKPIs, TaskStatusSummary, ExpenseCategorySummary,
    ResourceUtilization, BurnRateData,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard", response_model=DashboardKPIs)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get dashboard KPI data."""
    service = ReportService(db)
    kpis = await service.get_dashboard_kpis()
    return DashboardKPIs(**kpis)


@router.get("/tasks-summary", response_model=List[TaskStatusSummary])
async def get_task_summary(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get task status distribution for charts."""
    service = ReportService(db)
    data = await service.get_task_status_summary()
    return [TaskStatusSummary(**item) for item in data]


@router.get("/expense-categories", response_model=List[ExpenseCategorySummary])
async def get_expense_categories(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get expense category distribution for pie chart."""
    service = ReportService(db)
    data = await service.get_expense_category_summary()
    return [ExpenseCategorySummary(**item) for item in data]


@router.get("/resource-utilization", response_model=List[ResourceUtilization])
async def get_resource_utilization(
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """Get resource utilization (estimated vs actual hours)."""
    service = ReportService(db)
    data = await service.get_resource_utilization(project_id)
    return [ResourceUtilization(**item) for item in data]


@router.get("/burn-rate/{project_id}", response_model=BurnRateData)
async def get_burn_rate(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """Get project budget burn rate."""
    service = ReportService(db)
    data = await service.get_burn_rate(project_id)
    if not data:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Project")
    return BurnRateData(**data)
