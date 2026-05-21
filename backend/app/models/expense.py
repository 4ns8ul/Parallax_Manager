"""
Expense model — logs corporate expenditures and tracks manager approvals.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, Numeric, CheckConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class Expense(Base):
    """
    Expenses table — tracks expense claims linked to employees and optionally to tasks.
    Amount must be > 0, enforced at both Pydantic schema and DB constraint level.
    """
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_expense_amount"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    employee_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(18, 4), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="SUBMITTED")
    bill_image_url = Column(String(512), nullable=True)
    approved_by = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    employee = relationship("User", back_populates="submitted_expenses", foreign_keys=[employee_id])
    task = relationship("Task", back_populates="expenses")
    approver = relationship("User", foreign_keys=[approved_by])
