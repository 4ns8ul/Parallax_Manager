"""Notification Repository."""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.repositories.base import BaseRepository
from app.models.notification import Notification


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_for_user(self, user_id: int, skip: int = 0, limit: int = 50) -> List[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.recipient_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_unread(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Notification)
            .where(Notification.recipient_id == user_id, Notification.status == "UNREAD")
        )
        return result.scalar_one()

    async def mark_as_read(self, notification_id: int, user_id: int):
        await self.db.execute(
            update(Notification)
            .where(Notification.id == notification_id, Notification.recipient_id == user_id)
            .values(status="READ")
        )
        await self.db.flush()

    async def mark_all_read(self, user_id: int):
        await self.db.execute(
            update(Notification)
            .where(Notification.recipient_id == user_id, Notification.status == "UNREAD")
            .values(status="READ")
        )
        await self.db.flush()

    async def delete_all(self, user_id: int):
        from sqlalchemy import delete
        await self.db.execute(
            delete(Notification)
            .where(Notification.recipient_id == user_id)
        )
        await self.db.flush()
