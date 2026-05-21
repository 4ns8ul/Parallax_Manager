"""Task Repository — data access for Task entity."""

from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.task import Task


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: AsyncSession):
        super().__init__(Task, db)

    async def get_with_relations(self, task_id: int) -> Optional[Task]:
        result = await self.db.execute(
            select(Task)
            .options(
                selectinload(Task.project),
                selectinload(Task.assignee),
            )
            .where(Task.id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.assignee))
            .where(Task.project_id == project_id)
            .order_by(Task.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_assignee(self, assignee_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.project))
            .where(Task.assignee_id == assignee_id)
            .order_by(Task.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_with_relations(self, skip: int = 0, limit: int = 100, status: Optional[str] = None, project_id: Optional[int] = None) -> List[Task]:
        stmt = select(Task).options(
            selectinload(Task.project),
            selectinload(Task.assignee),
        )
        if status:
            stmt = stmt.where(Task.status == status)
        if project_id:
            stmt = stmt.where(Task.project_id == project_id)
        stmt = stmt.order_by(Task.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_by_status(self) -> dict:
        """Returns task counts grouped by status."""
        result = await self.db.execute(
            select(Task.status, func.count(Task.id))
            .group_by(Task.status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_filtered(self, status: Optional[str] = None, project_id: Optional[int] = None) -> int:
        stmt = select(func.count()).select_from(Task)
        if status:
            stmt = stmt.where(Task.status == status)
        if project_id:
            stmt = stmt.where(Task.project_id == project_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()
