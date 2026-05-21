"""Project Repository — data access for Project and ProjectAssignment."""

from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.project import Project, ProjectAssignment


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: AsyncSession):
        super().__init__(Project, db)

    async def get_with_relations(self, project_id: int) -> Optional[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.manager),
                selectinload(Project.assignments),
                selectinload(Project.tasks),
            )
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_all_with_manager(self, skip: int = 0, limit: int = 100) -> List[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.manager),
                selectinload(Project.assignments),
                selectinload(Project.tasks),
            )
            .order_by(Project.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_projects_for_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get projects where user is a member or manager."""
        result = await self.db.execute(
            select(Project)
            .outerjoin(ProjectAssignment)
            .options(
                selectinload(Project.manager),
                selectinload(Project.tasks)
            )
            .where(
                (Project.manager_id == user_id) | (ProjectAssignment.user_id == user_id)
            )
            .order_by(Project.created_at.desc())
            .distinct()
            .offset(skip).limit(limit)
        )
        return list(result.scalars().unique().all())

    async def add_members(self, project_id: int, user_ids: List[int]):
        for user_id in user_ids:
            existing = await self.db.execute(
                select(ProjectAssignment).where(
                    ProjectAssignment.project_id == project_id,
                    ProjectAssignment.user_id == user_id,
                )
            )
            if not existing.scalar_one_or_none():
                self.db.add(ProjectAssignment(project_id=project_id, user_id=user_id))
        await self.db.flush()

    async def is_user_member(self, project_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.user_id == user_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def count_for_user(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Project)
            .outerjoin(ProjectAssignment)
            .where(
                (Project.manager_id == user_id) | (ProjectAssignment.user_id == user_id)
            )
        )
        return result.scalar_one()
