from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.projects import Project, ProjectAssignment
from app.models.users import User

class ProjectRepository(BaseRepository[Project]):
    def __init__(self):
        super().__init__(Project)

    async def get(self, db: AsyncSession, id: int) -> Optional[Project]:
        """
        Retrieve a single project by its primary key, eager loading manager and members.
        """
        query = (
            select(Project)
            .filter(Project.id == id)
            .options(selectinload(Project.manager), selectinload(Project.members))
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Project]:
        """
        Fetch all projects with skip/limit pagination, eager loading manager and members.
        """
        query = (
            select(Project)
            .options(selectinload(Project.manager), selectinload(Project.members))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_assigned_projects(self, db: AsyncSession, user_id: int) -> List[Project]:
        """
        Fetch projects where the user is either the assigned Project Manager OR an assigned member.
        """
        query = (
            select(Project)
            .outerjoin(Project.members)
            .filter((Project.manager_id == user_id) | (User.id == user_id))
            .distinct()
            .options(selectinload(Project.manager), selectinload(Project.members))
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def assign_user(self, db: AsyncSession, project_id: int, user_id: int) -> ProjectAssignment:
        """
        Assign an employee to a project workspace.
        """
        assignment = ProjectAssignment(project_id=project_id, user_id=user_id)
        db.add(assignment)
        await db.flush()
        return assignment

    async def remove_user(self, db: AsyncSession, project_id: int, user_id: int) -> bool:
        """
        Remove an employee assignment from a project workspace.
        """
        query = select(ProjectAssignment).filter(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.user_id == user_id
        )
        result = await db.execute(query)
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.flush()
            return True
        return False

project_repo = ProjectRepository()
