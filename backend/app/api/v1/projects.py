"""Project API routes."""

from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectMemberAdd, ProjectResponse, ProjectListResponse
from app.schemas.auth import MessageResponse
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List projects (RBAC-scoped: Admin sees all, others see assigned only)."""
    service = ProjectService(db)
    from app.services.user_service import UserService
    user_service = UserService(db)
    user_roles = await user_service.get_user_role_names(current_user.id)

    skip = (page - 1) * page_size
    projects, total = await service.list_projects(skip, page_size, user=current_user, user_roles=user_roles)

    project_responses = []
    for p in projects:
        project_responses.append(ProjectResponse(
            id=p.id, name=p.name, description=p.description,
            status=p.status, manager_id=p.manager_id,
            manager_name=p.manager.full_name if p.manager else "",
            total_budget=p.total_budget,
            member_count=len(p.assignments) if p.assignments else 0,
            member_ids=[a.user_id for a in p.assignments] if p.assignments else [],
            task_count=len(p.tasks) if hasattr(p, 'tasks') and p.tasks else 0,
            created_at=p.created_at, updated_at=p.updated_at,
        ))

    return ProjectListResponse(projects=project_responses, total=total, page=page, page_size=page_size)


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Create a new project (Admin only)."""
    service = ProjectService(db)
    ip = request.client.host if request.client else None
    project = await service.create_project(data, actor_id=current_user.id, ip=ip)
    return ProjectResponse(
        id=project.id, name=project.name, description=project.description,
        status=project.status, manager_id=project.manager_id,
        total_budget=project.total_budget,
        member_ids=[a.user_id for a in project.assignments] if hasattr(project, 'assignments') and project.assignments else [],
        created_at=project.created_at, updated_at=project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get project details."""
    service = ProjectService(db)
    project = await service.get_project(project_id)
    return ProjectResponse(
        id=project.id, name=project.name, description=project.description,
        status=project.status, manager_id=project.manager_id,
        manager_name=project.manager.full_name if project.manager else "",
        total_budget=project.total_budget,
        member_count=len(project.assignments) if project.assignments else 0,
        member_ids=[a.user_id for a in project.assignments] if project.assignments else [],
        task_count=len(project.tasks) if project.tasks else 0,
        created_at=project.created_at, updated_at=project.updated_at,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Update project (Admin only)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)
    service = ProjectService(db)
    ip = request.client.host if request.client else None
    project = await service.update_project(project_id, data, actor_id=current_user.id, user_roles=user_roles, ip=ip)
    return ProjectResponse(
        id=project.id, name=project.name, description=project.description,
        status=project.status, manager_id=project.manager_id,
        total_budget=project.total_budget,
        member_ids=[a.user_id for a in project.assignments] if hasattr(project, 'assignments') and project.assignments else [],
        created_at=project.created_at, updated_at=project.updated_at,
    )


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Delete project (Admin only)."""
    service = ProjectService(db)
    ip = request.client.host if request.client else None
    await service.delete_project(project_id, actor_id=current_user.id, ip=ip)
    return MessageResponse(message="Project deleted successfully.")


@router.post("/{project_id}/members", response_model=MessageResponse)
async def add_members(
    project_id: int,
    data: ProjectMemberAdd,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["MANAGER"])),
):
    """Set members to a project."""
    service = ProjectService(db)
    ip = request.client.host if request.client else None
    await service.add_members(project_id, data.user_ids, actor_id=current_user.id, ip=ip)
    return MessageResponse(message="Members added successfully.")
