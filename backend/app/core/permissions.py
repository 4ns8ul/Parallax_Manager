"""
RBAC Permission Checker.
Dynamically loads permissions from the database and checks against endpoint requirements.
Supports fine-grained resource:action permission keys (e.g., 'task:create', 'expense:approve').
"""

from typing import List

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenException


def require_permissions(required_permissions: List[str]):
    """
    Dependency factory that checks if the current user has the required permissions.
    Permissions are in the format 'resource:action' (e.g., 'task:assign', 'expense:approve').
    ADMIN role bypasses all permission checks.
    """
    async def permission_checker(
        request: Request,
        db: AsyncSession = Depends(get_db),
    ):
        user = await get_current_user(request, db)

        # Import here to avoid circular imports
        from app.models.user import UserRole, Role, RolePermission, Permission

        # Get all permission names for this user
        stmt = (
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        result = await db.execute(stmt)
        user_permissions = {row[0] for row in result.all()}

        # Also check role names — ADMIN bypasses all
        role_stmt = (
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        role_result = await db.execute(role_stmt)
        user_roles = {row[0] for row in role_result.all()}

        if "ADMIN" in user_roles:
            user.role_names = list(user_roles)
            user.permission_names = list(user_permissions)
            return user

        # Check if user has ALL required permissions
        missing = set(required_permissions) - user_permissions
        if missing:
            raise ForbiddenException(
                f"Missing required permissions: {', '.join(missing)}."
            )

        user.role_names = list(user_roles)
        user.permission_names = list(user_permissions)
        return user

    return permission_checker
