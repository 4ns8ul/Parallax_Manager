"""
AuditLog model — captures system mutations for security compliance and audit trails.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey

from app.database import Base


class AuditLog(Base):
    """Audit_Logs table — immutable record of all significant data mutations."""
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    resource_id = Column(BigInteger, nullable=False)
    changes = Column(Text, nullable=True)  # JSON string of delta
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
