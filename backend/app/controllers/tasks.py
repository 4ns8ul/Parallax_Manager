from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.task import task_service
from app.services.project import project_service
from app.schemas.tasks import TaskCreate, TaskOut, TaskUpdate, TaskStatusUpdate, TaskTimeLog
from app.services.auth import AuthService, PermissionChecker, TokenData
from typing import List

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskOut])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    List all tasks based on the employee's role visibility scope.
    """
    return await task_service.get_tasks(db, token_data.user_id, token_data.roles)

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Retrieve specific task details.
    """
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Access scoping check
    if "ADMIN" not in token_data.roles:
        project = task.project
        if not project or (project.manager_id != token_data.user_id and task.assignee_id != token_data.user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this task.")
            
    return task

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(PermissionChecker("task:create"))
):
    """
    Create a new project task. (Restricted to ADMIN or assigned Project Manager)
    """
    project = await project_service.get_project_by_id(db, task_in.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if "ADMIN" not in token_data.roles and project.manager_id != token_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project manager or admin can create tasks.")

    task = await task_service.create_task(db, token_data.user_id, task_in)
    await db.commit()
    return task

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Update task metadata. (Restricted to ADMIN or assigned Project Manager)
    """
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    project = task.project
    if "ADMIN" not in token_data.roles and (not project or project.manager_id != token_data.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project managers or admins can modify task properties.")

    updated_task = await task_service.update_task(db, token_data.user_id, task_id, task_in)
    await db.commit()
    return updated_task

@router.patch("/{task_id}/status", response_model=TaskOut)
async def update_task_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Transition task status states (TO_DO, IN_PROGRESS, DONE, etc.). Assignees can self-transition.
    """
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    project = task.project
    is_manager = project and project.manager_id == token_data.user_id

    # Enforce status permissions (Assignee, Project Manager, or Admin)
    if "ADMIN" not in token_data.roles and not is_manager and task.assignee_id != token_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assignees or managers can transition task status.")

    updated_task = await task_service.update_status(db, token_data.user_id, task_id, status_in.status)
    await db.commit()
    return updated_task

@router.post("/{task_id}/log-time", response_model=TaskOut)
async def log_task_time(
    task_id: int,
    log_in: TaskTimeLog,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Increment actual logged work effort hours on a task assignee card.
    """
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Enforce logging boundaries: assignees can log time on their own cards
    if "ADMIN" not in token_data.roles and task.assignee_id != token_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees can only log time on tasks assigned directly to them.")

    updated_task = await task_service.log_time(db, token_data.user_id, task_id, log_in.hours_to_add)
    await db.commit()
    return updated_task
