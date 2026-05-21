"""
Notification model — manages system messages and alerts.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    """Notifications table — in-app notifications for task assignments, expense approvals, etc."""
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    recipient_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="UNREAD")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    recipient = relationship("User", back_populates="notifications", foreign_keys=[recipient_id])
