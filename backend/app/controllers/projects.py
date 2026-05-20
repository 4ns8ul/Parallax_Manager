from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.project import project_service
from app.schemas.projects import ProjectCreate, ProjectOut, ProjectUpdate, ProjectAssignmentRequest
from app.services.auth import AuthService, PermissionChecker, TokenData
from typing import List

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    List all active projects within the user's workspace scope.
    """
    return await project_service.get_projects_for_user(db, token_data.user_id, token_data.roles)

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Retrieve specific project detail parameters.
    """
    project = await project_service.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    # Scops validation: enforce that non-admins/managers are assigned members
    if "ADMIN" not in token_data.roles and project.manager_id != token_data.user_id:
        member_ids = [m.id for m in project.members]
        if token_data.user_id not in member_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project workspace.")
            
    return project

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(PermissionChecker("project:create"))
):
    """
    Register a new project workspace. (Restricted to ADMIN)
    """
    project = await project_service.create_project(db, token_data.user_id, project_in)
    await db.commit()
    return project

@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Update project attributes. (Restricted to ADMIN or assigned Project Manager)
    """
    project = await project_service.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if "ADMIN" not in token_data.roles and project.manager_id != token_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned manager or admin can update this project.")

    updated_project = await project_service.update_project(db, token_data.user_id, project_id, project_in)
    await db.commit()
    return updated_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(PermissionChecker("project:delete"))
):
    """
    Delete a project. (Restricted to ADMIN)
    """
    success = await project_service.delete_project(db, token_data.user_id, project_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    await db.commit()

@router.post("/{project_id}/assign", status_code=status.HTTP_200_OK)
async def assign_project_member(
    project_id: int,
    assignment_in: ProjectAssignmentRequest,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Assign an employee to a project workspace. (Restricted to ADMIN or assigned Project Manager)
    """
    project = await project_service.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if "ADMIN" not in token_data.roles and project.manager_id != token_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned manager or admin can assign members.")

    await project_service.assign_member(db, token_data.user_id, project_id, assignment_in.user_id)
    await db.commit()
    return {"status": "SUCCESS", "message": f"Employee {assignment_in.user_id} successfully assigned to project {project_id}."}

@router.delete("/{project_id}/assign", status_code=status.HTTP_200_OK)
async def unassign_project_member(
    project_id: int,
    assignment_in: ProjectAssignmentRequest,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Remove an employee assignment from a project workspace. (Restricted to ADMIN or assigned Project Manager)
    """
    project = await project_service.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if "ADMIN" not in token_data.roles and project.manager_id != token_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned manager or admin can remove members.")

    success = await project_service.remove_member(db, token_data.user_id, project_id, assignment_in.user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member assignment not found.")
    await db.commit()
    return {"status": "SUCCESS", "message": f"Employee {assignment_in.user_id} removed from project {project_id}."}
