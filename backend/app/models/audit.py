from sqlalchemy import Column, BIGINT, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BIGINT, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # INSERT, UPDATE, DELETE, LOGIN, etc.
    resource = Column(String(100), nullable=False)  # Table name or feature area
    resource_id = Column(BIGINT, nullable=False)
    changes = Column(String, nullable=True)  # NVARCHAR(MAX) holding JSON diff payload
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
