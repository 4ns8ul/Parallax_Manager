"""
FastAPI Dependency Injection Utilities.
Provides get_current_user and role-checking dependencies for route protection.
"""

from typing import Optional, List

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Extract and validate the current user from the JWT access token.
    Token is read from the Authorization header (Bearer scheme)
    or from the httpOnly cookie.
    """
    # Try Authorization header first
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]

    # Fallback to cookie
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise UnauthorizedException("Authentication required. Please log in.")

    payload = decode_access_token(token)
    if payload is None:
        raise UnauthorizedException("Invalid or expired token. Please log in again.")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid token payload.")

    # Import here to avoid circular imports
    from app.models.user import User

    stmt = (
        select(User)
        .options(
            selectinload(User.user_roles)
        )
        .where(User.id == int(user_id), User.status == "ACTIVE")
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedException("User not found or account deactivated.")

    return user


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory that checks if the current user has any of the allowed roles.
    Usage: Depends(require_roles(["ADMIN", "MANAGER"]))
    """
    async def role_checker(
        request: Request,
        db: AsyncSession = Depends(get_db),
    ):
        user = await get_current_user(request, db)

        # Import here to avoid circular imports
        from app.models.user import UserRole, Role
        from sqlalchemy import select as sa_select

        # Get user's role names
        stmt = (
            sa_select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        result = await db.execute(stmt)
        user_roles = [row[0] for row in result.all()]

        if not any(role in allowed_roles for role in user_roles):
            raise ForbiddenException(
                f"This action requires one of the following roles: {', '.join(allowed_roles)}."
            )

        # Attach roles to the user object for downstream use
        user.role_names = user_roles
        return user

    return role_checker


async def get_optional_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current user if authenticated, None otherwise. For public endpoints."""
    try:
        return await get_current_user(request, db)
    except UnauthorizedException:
        return None
