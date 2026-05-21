"""Notification Service — creates and manages in-app notifications."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.notification_repo import NotificationRepository
from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notif_repo = NotificationRepository(db)

    async def create_notification(self, recipient_id: int, title: str, message: str, notif_type: str):
        notif = Notification(
            recipient_id=recipient_id,
            title=title,
            message=message,
            type=notif_type,
        )
        await self.notif_repo.create(notif)

    async def get_notifications(self, user_id: int, skip: int = 0, limit: int = 50):
        notifications = await self.notif_repo.get_for_user(user_id, skip, limit)
        unread_count = await self.notif_repo.count_unread(user_id)
        total = len(notifications)
        return notifications, total, unread_count

    async def mark_read(self, notification_id: int, user_id: int):
        await self.notif_repo.mark_as_read(notification_id, user_id)

    async def mark_all_read(self, user_id: int):
        await self.notif_repo.mark_all_read(user_id)

    async def delete_all(self, user_id: int):
        await self.notif_repo.delete_all(user_id)
