from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.tasks import Task
from app.models.projects import Project

class TaskRepository(BaseRepository[Task]):
    def __init__(self):
        super().__init__(Task)

    async def get(self, db: AsyncSession, id: int) -> Optional[Task]:
        """
        Fetch a single task by id, eager loading the assignee and project details.
        """
        query = (
            select(Task)
            .filter(Task.id == id)
            .options(selectinload(Task.assignee), selectinload(Task.project))
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Task]:
        """
        Fetch all tasks, eager loading assignee details.
        """
        query = (
            select(Task)
            .options(selectinload(Task.assignee))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_by_project(self, db: AsyncSession, project_id: int) -> List[Task]:
        """
        Fetch all tasks inside a project, eager loading their assignee details.
        """
        result = await db.execute(
            select(Task)
            .filter(Task.project_id == project_id)
            .options(selectinload(Task.assignee))
        )
        return list(result.scalars().all())

    async def get_by_assignee(self, db: AsyncSession, assignee_id: int) -> List[Task]:
        """
        Fetch all tasks assigned to a specific employee across all projects.
        """
        result = await db.execute(
            select(Task)
            .filter(Task.assignee_id == assignee_id)
            .options(selectinload(Task.project))
        )
        return list(result.scalars().all())

    async def get_by_manager(self, db: AsyncSession, manager_id: int) -> List[Task]:
        """
        Fetch all tasks across all projects managed by a specific project manager.
        """
        query = (
            select(Task)
            .join(Task.project)
            .filter(Project.manager_id == manager_id)
            .options(selectinload(Task.assignee), selectinload(Task.project))
        )
        result = await db.execute(query)
        return list(result.scalars().all())

task_repo = TaskRepository()
