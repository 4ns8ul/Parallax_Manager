from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.notification import notification_service
from app.schemas.notifications import NotificationOut
from app.services.auth import AuthService, TokenData
from typing import List

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
async def list_my_notifications(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Fetch all in-app notifications sent to the currently logged-in user.
    """
    return await notification_service.get_user_notifications(db, token_data.user_id)

@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Mark an in-app alert as READ.
    """
    success = await notification_service.mark_as_read(db, token_data.user_id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied."
        )
    await db.commit()
    return {"status": "SUCCESS", "message": "Notification marked as read."}
