"""User management API routes — Admin only for CRUD, all users for profile."""

from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.schemas.user import UserCreate, UserUpdate, UserRoleUpdate, UserResponse, UserListResponse
from app.schemas.auth import MessageResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """List all users (Admin or Manager)."""
    service = UserService(db)
    skip = (page - 1) * page_size
    users, total = await service.list_users(skip, page_size)

    user_responses = []
    for u in users:
        roles = await service.get_user_role_names(u.id)
        user_responses.append(UserResponse(
            id=u.id, email=u.email, first_name=u.first_name,
            last_name=u.last_name, status=u.status, roles=roles,
            created_at=u.created_at, updated_at=u.updated_at,
        ))

    return UserListResponse(users=user_responses, total=total, page=page, page_size=page_size)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Create a new user (Admin only)."""
    service = UserService(db)
    ip = request.client.host if request.client else None
    user = await service.create_user(data, actor_id=current_user.id, ip=ip)
    roles = await service.get_user_role_names(user.id)
    return UserResponse(
        id=user.id, email=user.email, first_name=user.first_name,
        last_name=user.last_name, status=user.status, roles=roles,
        created_at=user.created_at, updated_at=user.updated_at,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get current authenticated user's profile."""
    service = UserService(db)
    roles = await service.get_user_role_names(current_user.id)
    return UserResponse(
        id=current_user.id, email=current_user.email,
        first_name=current_user.first_name, last_name=current_user.last_name,
        status=current_user.status, roles=roles,
        created_at=current_user.created_at, updated_at=current_user.updated_at,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Get user by ID (Admin only)."""
    service = UserService(db)
    user = await service.get_user(user_id)
    roles = await service.get_user_role_names(user.id)
    return UserResponse(
        id=user.id, email=user.email, first_name=user.first_name,
        last_name=user.last_name, status=user.status, roles=roles,
        created_at=user.created_at, updated_at=user.updated_at,
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Update user (Admin only)."""
    service = UserService(db)
    ip = request.client.host if request.client else None
    user = await service.update_user(user_id, data, actor_id=current_user.id, ip=ip)
    roles = await service.get_user_role_names(user.id)
    return UserResponse(
        id=user.id, email=user.email, first_name=user.first_name,
        last_name=user.last_name, status=user.status, roles=roles,
        created_at=user.created_at, updated_at=user.updated_at,
    )


@router.put("/{user_id}/roles", response_model=MessageResponse)
async def update_user_roles(
    user_id: int,
    data: UserRoleUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Update user roles (Admin only)."""
    service = UserService(db)
    ip = request.client.host if request.client else None
    await service.update_user_roles(user_id, data.role_ids, actor_id=current_user.id, ip=ip)
    return MessageResponse(message="User roles updated successfully.")


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN"])),
):
    """Delete user (Admin only)."""
    service = UserService(db)
    ip = request.client.host if request.client else None
    await service.delete_user(user_id, actor_id=current_user.id, ip=ip)
    return MessageResponse(message="User deleted successfully.")
