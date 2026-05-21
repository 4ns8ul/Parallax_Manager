"""Project Service — business logic for project CRUD and member management."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.project_repo import ProjectRepository
from app.repositories.user_repo import UserRepository
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.core.audit import log_audit
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)

    async def create_project(self, data: ProjectCreate, actor_id: int = None, ip: str = None) -> Project:
        # Validate manager exists if provided
        if data.manager_id is not None:
            manager = await self.user_repo.get_by_id(data.manager_id)
            if not manager:
                raise BadRequestException(f"Manager with ID {data.manager_id} does not exist.")

        project = Project(
            name=data.name,
            description=data.description,
            status=data.status,
            manager_id=data.manager_id,
            total_budget=data.total_budget,
        )
        project = await self.project_repo.create(project)
        await log_audit(self.db, actor_id, "INSERT", "projects", project.id, ip_address=ip)
        return project

    async def get_project(self, project_id: int) -> Project:
        project = await self.project_repo.get_with_relations(project_id)
        if not project:
            raise NotFoundException("Project")
        return project

    async def list_projects(self, skip: int = 0, limit: int = 100, user=None, user_roles=None):
        """
        List projects with RBAC scoping:
        - ADMIN sees all projects
        - MANAGER/EMPLOYEE sees only assigned projects
        """
        if user_roles and "ADMIN" in user_roles:
            projects = await self.project_repo.get_all_with_manager(skip, limit)
            total = await self.project_repo.count()
        else:
            projects = await self.project_repo.get_projects_for_user(user.id, skip, limit)
            total = await self.project_repo.count_for_user(user.id)
        return projects, total

    async def update_project(self, project_id: int, data: ProjectUpdate, actor_id: int = None, user_roles=None, ip: str = None) -> Project:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        changes = {}
        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            old_val = getattr(project, field)
            if old_val != value:
                changes[field] = {"old": str(old_val), "new": str(value)}
                setattr(project, field, value)

        project = await self.project_repo.update(project)
        if changes:
            await log_audit(self.db, actor_id, "UPDATE", "projects", project.id, changes=changes, ip_address=ip)
        return project

    async def delete_project(self, project_id: int, actor_id: int = None, ip: str = None):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")
        await self.project_repo.delete(project)
        await log_audit(self.db, actor_id, "DELETE", "projects", project_id, ip_address=ip)

    async def add_members(self, project_id: int, user_ids: list, actor_id: int = None, ip: str = None):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        for uid in user_ids:
            user = await self.user_repo.get_by_id(uid)
            if not user:
                raise BadRequestException(f"User with ID {uid} does not exist.")

        from app.models.project import ProjectAssignment
        from sqlalchemy import delete
        await self.db.execute(delete(ProjectAssignment).where(ProjectAssignment.project_id == project_id))
        
        await self.project_repo.add_members(project_id, user_ids)
        await log_audit(
            self.db, actor_id, "UPDATE", "project_assignments", project_id,
            changes={"added_members": user_ids}, ip_address=ip,
        )
