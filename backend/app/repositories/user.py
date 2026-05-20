from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.users import User, Role, Permission

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Fetch a user by email, eager loading their associated roles.
        """
        result = await db.execute(
            select(User)
            .filter(User.email == email)
            .options(selectinload(User.roles))
        )
        return result.scalars().first()

    async def get_permissions(self, db: AsyncSession, user_id: int) -> List[str]:
        """
        Resolve all unique permission keys assigned to a user via their roles.
        """
        query = (
            select(Permission.name)
            .join(Permission.roles)
            .join(Role.users)
            .filter(User.id == user_id)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

user_repo = UserRepository()
