from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.repositories.project import project_repo
from app.repositories.task import task_repo
from app.repositories.expense import expense_repo
from app.models.tasks import Task
from app.models.expenses import Expense
from app.models.projects import Project
from app.models.users import User
from app.schemas.reports import GanttTask, BurndownData, ExpenseSegment, ResourceUtilization, DashboardSummary
from decimal import Decimal
from datetime import datetime, timedelta

class ReportService:
    async def get_gantt_chart(self, db: AsyncSession, project_id: int) -> List[GanttTask]:
        """
        Calculate task schedule timelines showing day offsets from project start and estimated durations.
        """
        project = await project_repo.get(db, project_id)
        if not project:
            return []

        tasks = await task_repo.get_by_project(db, project_id)
        gantt_data = []
        
        proj_start = project.created_at.date()

        for idx, task in enumerate(tasks):
            task_created = task.created_at.date()
            # Calculate offset from project creation
            offset = (task_created - proj_start).days
            if offset < 0:
                offset = 0

            # Compute duration in days based on estimated hours (8 hours = 1 day)
            # Default to at least 1 day to render nicely on the Gantt chart
            duration = int(task.est_hours / Decimal("8.00"))
            if duration <= 0:
                duration = 2

            gantt_data.append(GanttTask(
                name=task.title,
                startOffset=offset,
                duration=duration
            ))

        # Fallback if no tasks exist
        if not gantt_data:
            gantt_data = [
                GanttTask(name="No Tasks Created", startOffset=0, duration=2)
            ]
        return gantt_data

    async def get_burndown_chart(self, db: AsyncSession, project_id: int) -> List[BurndownData]:
        """
        Synthesize a realistic 10-day Sprint Burndown dataset mapping ideal trajectory alongside actual task points.
        """
        tasks = await task_repo.get_by_project(db, project_id)
        total_est = sum(task.est_hours for task in tasks)
        if total_est == 0:
            total_est = Decimal("80.00")  # Default placeholder for empty project

        burndown = []
        days = ["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10"]
        
        # Calculate completed hours sum
        total_completed = sum(task.actual_hours for task in tasks if task.status == "DONE")

        for idx, day in enumerate(days):
            # Ideal line goes linearly from total estimate to 0
            ideal = total_est - (total_est * Decimal(str(idx)) / Decimal("10.00"))
            
            # Actual remaining drops as tasks get completed
            # To simulate a realistic burn curve, we deduct parts of logged hours per day
            actual = total_est
            if idx > 0:
                # Actual drops gradually over sprint days
                completed_portion = (total_completed * Decimal(str(idx)) / Decimal("10.00"))
                actual = total_est - completed_portion
                if idx == 10:
                    actual = total_est - total_completed
            
            if actual < 0:
                actual = Decimal("0.00")

            burndown.append(BurndownData(
                day=day,
                idealRemaining=round(ideal, 2),
                actualRemaining=round(actual, 2)
            ))
        return burndown

    async def get_expense_distribution(self, db: AsyncSession, project_id: int) -> List[ExpenseSegment]:
        """
        Aggregate approved expenses by category to visualize in the Pie chart.
        """
        query = (
            select(Expense.category, func.sum(Expense.amount))
            .filter(Expense.project_id == project_id)
            .filter(Expense.status == "APPROVED")
            .group_by(Expense.category)
        )
        result = await db.execute(query)
        rows = result.all()
        
        segments = [
            ExpenseSegment(name=row[0], value=row[1]) for row in rows
        ]

        # Seed defaults if empty
        if not segments:
            segments = [
                ExpenseSegment(name="Travel", value=Decimal("0.00")),
                ExpenseSegment(name="Meals", value=Decimal("0.00")),
                ExpenseSegment(name="Software", value=Decimal("0.00"))
            ]
        return segments

    async def get_resource_allocation(self, db: AsyncSession, project_id: int) -> List[ResourceUtilization]:
        """
        Compare allocated estimated effort versus completed/actual effort grouped per employee.
        """
        query = (
            select(
                User.first_name, 
                User.last_name,
                func.sum(Task.est_hours),
                func.sum(Task.actual_hours)
            )
            .join(Task.assignee)
            .filter(Task.project_id == project_id)
            .group_by(User.id, User.first_name, User.last_name)
        )
        result = await db.execute(query)
        rows = result.all()

        utilization = [
            ResourceUtilization(
                employee=f"{row[0]} {row[1]}",
                allocated=row[2],
                completed=row[3]
            ) for row in rows
        ]

        if not utilization:
            utilization = [
                ResourceUtilization(employee="Staff Unassigned", allocated=Decimal("0.00"), completed=Decimal("0.00"))
            ]
        return utilization

    async def get_dashboard_summary(self, db: AsyncSession, user_id: int, roles: List[str]) -> DashboardSummary:
        """
        Compile high-level KPI cards for the main landing dashboard based on the logged-in user's role.
        """
        # Count projects
        if "ADMIN" in roles:
            proj_count_query = select(func.count(Project.id))
            task_count_query = select(func.count(Task.id)).filter(Task.status != "DONE")
            expense_query = select(func.count(Expense.id), func.sum(Expense.amount)).filter(Expense.status == "SUBMITTED")
        elif "MANAGER" in roles:
            proj_count_query = select(func.count(Project.id)).filter(Project.manager_id == user_id)
            task_count_query = select(func.count(Task.id)).join(Task.project).filter(Project.manager_id == user_id).filter(Task.status != "DONE")
            expense_query = select(func.count(Expense.id), func.sum(Expense.amount)).join(Expense.project).filter(Project.manager_id == user_id).filter(Expense.status == "SUBMITTED")
        else:
            proj_count_query = select(func.count(Project.id)).join(Project.members).filter(User.id == user_id)
            task_count_query = select(func.count(Task.id)).filter(Task.assignee_id == user_id).filter(Task.status != "DONE")
            expense_query = select(func.count(Expense.id), func.sum(Expense.amount)).filter(Expense.employee_id == user_id).filter(Expense.status == "SUBMITTED")

        proj_res = await db.execute(proj_count_query)
        task_res = await db.execute(task_count_query)
        exp_res = await db.execute(expense_query)
        
        proj_count = proj_res.scalar() or 0
        task_count = task_res.scalar() or 0
        
        exp_row = exp_res.first()
        exp_count = exp_row[0] if exp_row and exp_row[0] else 0
        exp_amount = exp_row[1] if exp_row and exp_row[1] else Decimal("0.00")

        # Load recent notifications
        notif_query = (
            select(Expense.id, User.first_name, Expense.amount, Expense.category)
            .join(Expense.employee)
            .filter(Expense.status == "SUBMITTED")
            .limit(5)
        )
        notif_res = await db.execute(notif_query)
        recent_items = []
        for row in notif_res.all():
            recent_items.append({
                "id": row[0],
                "title": "Pending Expense Approval",
                "message": f"{row[1]} submitted {row[2]} USD for {row[3]}.",
                "type": "EXPENSE_APPROVAL"
            })

        return DashboardSummary(
            total_projects=proj_count,
            active_tasks=task_count,
            pending_expenses_count=exp_count,
            pending_expenses_amount=exp_amount,
            recent_notifications=recent_items
        )

report_service = ReportService()
