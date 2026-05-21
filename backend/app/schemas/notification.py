"""
Notification Schemas.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Notification response."""
    id: int
    title: str
    message: str
    type: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Notification list with unread count."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
