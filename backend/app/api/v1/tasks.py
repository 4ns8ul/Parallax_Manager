"""Task API routes."""

from fastapi import APIRouter, Depends, Request, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse, TaskListResponse
from app.schemas.auth import MessageResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List tasks (RBAC-scoped)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)

    service = TaskService(db)
    skip = (page - 1) * page_size
    tasks, total = await service.list_tasks(skip, page_size, user=current_user, user_roles=user_roles, status=status, project_id=project_id)

    task_responses = []
    for t in tasks:
        task_responses.append(TaskResponse(
            id=t.id, project_id=t.project_id,
            project_name=t.project.name if t.project else "",
            title=t.title, description=t.description,
            status=t.status, priority=t.priority,
            assignee_id=t.assignee_id,
            assignee_name=t.assignee.full_name if t.assignee else "",
            est_hours=t.est_hours, actual_hours=t.actual_hours,
            due_date=t.due_date, created_at=t.created_at, updated_at=t.updated_at,
        ))

    return TaskListResponse(tasks=task_responses, total=total, page=page, page_size=page_size)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """Create task (Admin or Manager of the project)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)

    service = TaskService(db)
    ip = request.client.host if request.client else None
    task = await service.create_task(data, actor_id=current_user.id, user_roles=user_roles, ip=ip)
    return TaskResponse(
        id=task.id, project_id=task.project_id, title=task.title,
        description=task.description, status=task.status, priority=task.priority,
        assignee_id=task.assignee_id, est_hours=task.est_hours,
        actual_hours=task.actual_hours, due_date=task.due_date,
        created_at=task.created_at, updated_at=task.updated_at,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get task details."""
    service = TaskService(db)
    task = await service.get_task(task_id)
    return TaskResponse(
        id=task.id, project_id=task.project_id,
        project_name=task.project.name if task.project else "",
        title=task.title, description=task.description,
        status=task.status, priority=task.priority,
        assignee_id=task.assignee_id,
        assignee_name=task.assignee.full_name if task.assignee else "",
        est_hours=task.est_hours, actual_hours=task.actual_hours,
        due_date=task.due_date, created_at=task.created_at, updated_at=task.updated_at,
    )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """Update task (Admin or Manager)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)

    service = TaskService(db)
    ip = request.client.host if request.client else None
    task = await service.update_task(task_id, data, actor_id=current_user.id, user_roles=user_roles, ip=ip)
    return TaskResponse(
        id=task.id, project_id=task.project_id, title=task.title,
        description=task.description, status=task.status, priority=task.priority,
        assignee_id=task.assignee_id, est_hours=task.est_hours,
        actual_hours=task.actual_hours, due_date=task.due_date,
        created_at=task.created_at, updated_at=task.updated_at,
    )


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    data: TaskStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update task status (any authenticated user, RBAC checked in service)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)

    service = TaskService(db)
    ip = request.client.host if request.client else None
    task = await service.update_status(task_id, data, actor_id=current_user.id, user_roles=user_roles, ip=ip)
    return TaskResponse(
        id=task.id, project_id=task.project_id, title=task.title,
        description=task.description, status=task.status, priority=task.priority,
        assignee_id=task.assignee_id, est_hours=task.est_hours,
        actual_hours=task.actual_hours, due_date=task.due_date,
        created_at=task.created_at, updated_at=task.updated_at,
    )


@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """Delete task (Admin or Manager)."""
    service = TaskService(db)
    ip = request.client.host if request.client else None
    await service.delete_task(task_id, actor_id=current_user.id, ip=ip)
    return MessageResponse(message="Task deleted successfully.")
