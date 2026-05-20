from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.repositories.base import BaseRepository
from app.models.notifications import Notification

class NotificationService:
    def __init__(self):
        self.repo = BaseRepository[Notification](Notification)

    async def get_user_notifications(self, db: AsyncSession, user_id: int) -> List[Notification]:
        """
        Fetch all notifications dispatched to a specific user, sorted newest first.
        """
        query = (
            select(Notification)
            .filter(Notification.recipient_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def mark_as_read(self, db: AsyncSession, user_id: int, notification_id: int) -> bool:
        """
        Set status of a user's notification to READ.
        """
        obj = await self.repo.get(db, notification_id)
        if not obj or obj.recipient_id != user_id:
            return False
        
        await self.repo.update(db, obj, {"status": "READ"})
        return True

    async def create_notification(
        self, db: AsyncSession, recipient_id: int, title: str, message: str, type: str
    ) -> Notification:
        """
        Synthesize and dispatch a new in-app notification.
        """
        return await self.repo.create(db, {
            "recipient_id": recipient_id,
            "title": title,
            "message": message,
            "type": type,
            "status": "UNREAD"
        })

notification_service = NotificationService()
