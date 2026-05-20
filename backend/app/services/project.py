from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.project import project_repo
from app.repositories.audit import audit_repo
from app.models.projects import Project, ProjectAssignment
from app.schemas.projects import ProjectCreate, ProjectUpdate

class ProjectService:
    async def get_projects_for_user(self, db: AsyncSession, user_id: int, roles: List[str]) -> List[Project]:
        """
        Scops project listings: ADMIN views all, whereas MANAGERS/EMPLOYEES view assigned or managed.
        """
        if "ADMIN" in roles:
            return await project_repo.get_all(db)
        return await project_repo.get_assigned_projects(db, user_id)

    async def get_project_by_id(self, db: AsyncSession, project_id: int) -> Optional[Project]:
        return await project_repo.get(db, project_id)

    async def create_project(self, db: AsyncSession, current_user_id: int, project_data: ProjectCreate) -> Project:
        """
        Initialize a new corporate project and record it in the audit history logs.
        """
        payload = project_data.model_dump()
        project = await project_repo.create(db, payload)
        
        # Log to audit trail
        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="INSERT",
            resource="Projects",
            resource_id=project.id,
            changes=payload
        )
        return await project_repo.get(db, project.id)

    async def update_project(
        self, db: AsyncSession, current_user_id: int, project_id: int, project_data: ProjectUpdate
    ) -> Optional[Project]:
        """
        Update project settings, tracking diffs inside audit trail logs.
        """
        project = await project_repo.get(db, project_id)
        if not project:
            return None
            
        old_values = {
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "total_budget": float(project.total_budget),
            "manager_id": project.manager_id
        }
        
        payload = project_data.model_dump(exclude_unset=True)
        updated_project = await project_repo.update(db, project, payload)
        
        # Log to audit trail
        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="UPDATE",
            resource="Projects",
            resource_id=project_id,
            changes={"from": old_values, "to": {k: float(v) if isinstance(v, (int, float)) else str(v) for k, v in payload.items()}}
        )
        return updated_project

    async def delete_project(self, db: AsyncSession, current_user_id: int, project_id: int) -> bool:
        """
        Remove a project and record it in audit logs.
        """
        success = await project_repo.delete(db, project_id)
        if success:
            await audit_repo.log_action(
                db=db,
                user_id=current_user_id,
                action="DELETE",
                resource="Projects",
                resource_id=project_id
            )
        return success

    async def assign_member(self, db: AsyncSession, current_user_id: int, project_id: int, user_id: int) -> ProjectAssignment:
        assignment = await project_repo.assign_user(db, project_id, user_id)
        
        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="INSERT",
            resource="ProjectAssignments",
            resource_id=project_id,
            changes={"assigned_user_id": user_id}
        )
        return assignment

    async def remove_member(self, db: AsyncSession, current_user_id: int, project_id: int, user_id: int) -> bool:
        success = await project_repo.remove_user(db, project_id, user_id)
        if success:
            await audit_repo.log_action(
                db=db,
                user_id=current_user_id,
                action="DELETE",
                resource="ProjectAssignments",
                resource_id=project_id,
                changes={"removed_user_id": user_id}
            )
        return success

project_service = ProjectService()
