"""
Generic Base Repository — provides common CRUD operations.
All domain-specific repositories extend this base (Liskov Substitution Principle).
"""

from typing import TypeVar, Generic, Type, Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """
    Generic repository implementing standard CRUD operations.
    Concrete repositories inherit from this and add domain-specific queries.
    This follows ISP — only basic ops exposed, domain repos add their own methods.
    """

    def __init__(self, model: Type[T], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: int) -> Optional[T]:
        """Get a single record by primary key."""
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get paginated list of records."""
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        """Get total count of records."""
        result = await self.db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()

    async def create(self, obj: T) -> T:
        """Insert a new record."""
        self.db.add(obj)
        await self.db.flush()  # Get the ID without committing
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: T) -> T:
        """Update an existing record (already attached to session)."""
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: T) -> None:
        """Delete a record."""
        await self.db.delete(obj)
        await self.db.flush()
