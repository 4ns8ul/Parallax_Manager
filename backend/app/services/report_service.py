"""Report Service — aggregates data for dashboard KPIs and chart visualizations."""

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.project import Project
from app.models.task import Task
from app.models.expense import Expense
from app.models.user import User
from app.repositories.task_repo import TaskRepository
from app.repositories.expense_repo import ExpenseRepository


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.expense_repo = ExpenseRepository(db)

    async def get_dashboard_kpis(self):
        # Projects
        total_projects = (await self.db.execute(select(func.count()).select_from(Project))).scalar_one()
        active_projects = (await self.db.execute(
            select(func.count()).select_from(Project).where(Project.status == "ACTIVE")
        )).scalar_one()

        # Tasks
        total_tasks = await self.task_repo.count()
        task_status_counts = await self.task_repo.count_by_status()
        completed_tasks = task_status_counts.get("DONE", 0)
        pending_tasks = task_status_counts.get("TO_DO", 0) + task_status_counts.get("IN_PROGRESS", 0)

        # Expenses
        total_expenses_result = (await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).select_from(Expense)
        )).scalar_one()
        total_expenses = Decimal(str(total_expenses_result))

        pending_expenses = (await self.db.execute(
            select(func.count()).select_from(Expense).where(Expense.status == "SUBMITTED")
        )).scalar_one()

        approved_expenses = await self.expense_repo.get_total_by_status("APPROVED")

        # Employees
        total_employees = (await self.db.execute(
            select(func.count()).select_from(User).where(User.status == "ACTIVE")
        )).scalar_one()

        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "total_expenses": total_expenses,
            "pending_expenses": pending_expenses,
            "approved_expenses": approved_expenses,
            "total_employees": total_employees,
        }

    async def get_task_status_summary(self):
        counts = await self.task_repo.count_by_status()
        return [{"status": status, "count": count} for status, count in counts.items()]

    async def get_expense_category_summary(self):
        return await self.expense_repo.get_category_summary()

    async def get_resource_utilization(self, project_id: int = None):
        stmt = (
            select(
                User.first_name,
                User.last_name,
                func.coalesce(func.sum(Task.est_hours), 0).label("estimated"),
                func.coalesce(func.sum(Task.actual_hours), 0).label("actual"),
            )
            .join(Task, Task.assignee_id == User.id)
        )
        if project_id:
            stmt = stmt.where(Task.project_id == project_id)
        stmt = stmt.group_by(User.id, User.first_name, User.last_name)

        result = await self.db.execute(stmt)
        return [
            {
                "employee_name": f"{row[0]} {row[1]}",
                "estimated_hours": Decimal(str(row[2])),
                "actual_hours": Decimal(str(row[3])),
            }
            for row in result.all()
        ]

    async def get_burn_rate(self, project_id: int):
        project = (await self.db.execute(
            select(Project).where(Project.id == project_id)
        )).scalar_one_or_none()

        if not project:
            return None

        total_spent = (await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0))
            .join(Task, Task.id == Expense.task_id)
            .where(Task.project_id == project_id, Expense.status == "APPROVED")
        )).scalar_one()

        total_spent = Decimal(str(total_spent))
        remaining = Decimal(str(project.total_budget)) - total_spent
        burn_pct = (total_spent / Decimal(str(project.total_budget)) * 100) if project.total_budget > 0 else Decimal("0")

        return {
            "project_name": project.name,
            "total_budget": Decimal(str(project.total_budget)),
            "total_spent": total_spent,
            "remaining": remaining,
            "burn_percentage": burn_pct,
        }
