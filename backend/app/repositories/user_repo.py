"""User Repository — data access for User, Role, and Permission entities."""

from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.user import User, Role, Permission, UserRole, RolePermission


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_with_roles(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.user_roles))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all_with_roles(self, skip: int = 0, limit: int = 100) -> List[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.user_roles))
            .order_by(User.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_user_role_names(self, user_id: int) -> List[str]:
        result = await self.db.execute(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        return [row[0] for row in result.all()]

    async def assign_roles(self, user_id: int, role_ids: List[int]):
        # Remove existing roles
        existing = await self.db.execute(
            select(UserRole).where(UserRole.user_id == user_id)
        )
        for ur in existing.scalars().all():
            await self.db.delete(ur)
        # Assign new roles
        for role_id in role_ids:
            self.db.add(UserRole(user_id=user_id, role_id=role_id))
        await self.db.flush()


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: AsyncSession):
        super().__init__(Role, db)

    async def get_by_name(self, name: str) -> Optional[Role]:
        result = await self.db.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, db: AsyncSession):
        super().__init__(Permission, db)
