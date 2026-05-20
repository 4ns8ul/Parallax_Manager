from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.expenses import Expense
from app.models.projects import Project

class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self):
        super().__init__(Expense)

    async def get(self, db: AsyncSession, id: int) -> Optional[Expense]:
        """
        Fetch a single expense by id, eager loading employee, approver, project, and task details.
        """
        query = (
            select(Expense)
            .filter(Expense.id == id)
            .options(
                selectinload(Expense.employee),
                selectinload(Expense.approver),
                selectinload(Expense.project),
                selectinload(Expense.task)
            )
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Expense]:
        """
        Fetch all expenses, eager loading employee and approver details.
        """
        query = (
            select(Expense)
            .options(selectinload(Expense.employee), selectinload(Expense.approver))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_by_employee(self, db: AsyncSession, employee_id: int) -> List[Expense]:
        """
        Fetch all expenses submitted by a specific employee.
        """
        result = await db.execute(
            select(Expense)
            .filter(Expense.employee_id == employee_id)
            .options(selectinload(Expense.project), selectinload(Expense.task))
        )
        return list(result.scalars().all())

    async def get_by_project_manager(self, db: AsyncSession, manager_id: int) -> List[Expense]:
        """
        Fetch all expenses submitted for projects managed by a specific project manager.
        """
        query = (
            select(Expense)
            .join(Expense.project)
            .filter(Project.manager_id == manager_id)
            .options(
                selectinload(Expense.employee),
                selectinload(Expense.project),
                selectinload(Expense.task)
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_all_with_details(self, db: AsyncSession) -> List[Expense]:
        """
        Fetch all expenses with full relational details loaded (Admin view).
        """
        query = (
            select(Expense)
            .options(
                selectinload(Expense.employee),
                selectinload(Expense.project),
                selectinload(Expense.task),
                selectinload(Expense.approver)
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

expense_repo = ExpenseRepository()
