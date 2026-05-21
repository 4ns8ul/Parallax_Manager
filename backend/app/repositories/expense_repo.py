"""Expense Repository — data access for Expense entity."""

from typing import Optional, List
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.expense import Expense


class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, db: AsyncSession):
        super().__init__(Expense, db)

    async def get_with_relations(self, expense_id: int) -> Optional[Expense]:
        result = await self.db.execute(
            select(Expense)
            .options(
                selectinload(Expense.employee),
                selectinload(Expense.task),
                selectinload(Expense.approver),
            )
            .where(Expense.id == expense_id)
        )
        return result.scalar_one_or_none()

    async def get_by_employee(self, employee_id: int, skip: int = 0, limit: int = 100) -> List[Expense]:
        result = await self.db.execute(
            select(Expense)
            .options(selectinload(Expense.task))
            .where(Expense.employee_id == employee_id)
            .order_by(Expense.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_with_relations(self, skip: int = 0, limit: int = 100, status: Optional[str] = None, employee_id: Optional[int] = None) -> List[Expense]:
        stmt = select(Expense).options(
            selectinload(Expense.employee),
            selectinload(Expense.task),
            selectinload(Expense.approver),
        )
        if status:
            stmt = stmt.where(Expense.status == status)
        if employee_id:
            stmt = stmt.where(Expense.employee_id == employee_id)
        stmt = stmt.order_by(Expense.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_filtered(self, status: Optional[str] = None, employee_id: Optional[int] = None) -> int:
        stmt = select(func.count()).select_from(Expense)
        if status:
            stmt = stmt.where(Expense.status == status)
        if employee_id:
            stmt = stmt.where(Expense.employee_id == employee_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_total_by_status(self, status: str) -> Decimal:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0))
            .where(Expense.status == status)
        )
        return Decimal(str(result.scalar_one()))

    async def get_category_summary(self) -> List[dict]:
        result = await self.db.execute(
            select(Expense.category, func.sum(Expense.amount).label("total"))
            .where(Expense.status == "APPROVED")
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
        )
        return [{"category": row[0], "total_amount": Decimal(str(row[1]))} for row in result.all()]

    async def get_pending_for_project(self, project_id: int) -> List[Expense]:
        """Get pending expenses for tasks in a specific project (for manager approval)."""
        from app.models.task import Task
        result = await self.db.execute(
            select(Expense)
            .join(Task, Task.id == Expense.task_id)
            .options(selectinload(Expense.employee))
            .where(Task.project_id == project_id, Expense.status == "SUBMITTED")
        )
        return list(result.scalars().all())
