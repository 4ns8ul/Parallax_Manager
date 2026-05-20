from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.report import report_service
from app.schemas.reports import GanttTask, BurndownData, ExpenseSegment, ResourceUtilization, DashboardSummary
from app.services.auth import AuthService, TokenData
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary_metrics(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Fetch high-level KPI cards for the landing dashboard based on user access scopes.
    """
    return await report_service.get_dashboard_summary(db, token_data.user_id, token_data.roles)

@router.get("/projects/{project_id}/gantt", response_model=List[GanttTask])
async def get_project_gantt_metrics(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Retrieve vertical stacked bar Gantt chart data.
    """
    return await report_service.get_gantt_chart(db, project_id)

@router.get("/projects/{project_id}/burndown", response_model=List[BurndownData])
async def get_project_burndown_metrics(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Retrieve ideal vs actual burndown metrics.
    """
    return await report_service.get_burndown_chart(db, project_id)

@router.get("/projects/{project_id}/expenses", response_model=List[ExpenseSegment])
async def get_project_expense_metrics(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Retrieve approved expense distribution by category.
    """
    return await report_service.get_expense_distribution(db, project_id)

@router.get("/projects/{project_id}/resources", response_model=List[ResourceUtilization])
async def get_project_resource_metrics(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Retrieve resource effort allocations and actual logged times.
    """
    return await report_service.get_resource_allocation(db, project_id)
