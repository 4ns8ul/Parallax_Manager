"""Notification API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.schemas.auth import MessageResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get current user's notifications."""
    service = NotificationService(db)
    notifications, total, unread = await service.get_notifications(current_user.id)
    return NotificationListResponse(
        notifications=[NotificationResponse(
            id=n.id, title=n.title, message=n.message,
            type=n.type, status=n.status, created_at=n.created_at,
        ) for n in notifications],
        total=total,
        unread_count=unread,
    )


@router.patch("/{notification_id}/read", response_model=MessageResponse)
async def mark_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark a notification as read."""
    service = NotificationService(db)
    await service.mark_read(notification_id, current_user.id)
    return MessageResponse(message="Notification marked as read.")


@router.patch("/read-all", response_model=MessageResponse)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark all notifications as read."""
    service = NotificationService(db)
    await service.mark_all_read(current_user.id)
    return MessageResponse(message="All notifications marked as read.")

@router.delete("/clear", response_model=MessageResponse)
async def clear_all(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete all notifications for the user."""
    service = NotificationService(db)
    await service.delete_all(current_user.id)
    return MessageResponse(message="All notifications cleared.")
