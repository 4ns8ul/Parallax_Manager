from sqlalchemy import Column, BIGINT, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BIGINT, primary_key=True, index=True, autoincrement=True)
    recipient_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(String, nullable=False)  # Maps to NVARCHAR(MAX) in MS SQL
    type = Column(String(50), nullable=False)  # TASK_ASSIGNED, EXPENSE_APPROVED, EXPENSE_REJECTED, etc.
    status = Column(String(50), default="UNREAD", nullable=False)  # UNREAD, READ, FAILED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    recipient = relationship("User", back_populates="notifications")
