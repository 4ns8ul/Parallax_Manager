"""
Task model — tracks individual execution items mapped to parent projects.
"""

from datetime import datetime, timezone, date

from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, Date, ForeignKey, Numeric, CheckConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class Task(Base):
    """
    Tasks table — tracks individual work items assigned to employees within projects.
    Hours constraints enforced at DB level to prevent negative values.
    """
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("est_hours >= 0", name="chk_task_est_hours"),
        CheckConstraint("actual_hours >= 0", name="chk_task_actual_hours"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="TO_DO")
    priority = Column(String(50), nullable=False, default="MEDIUM")
    assignee_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    est_hours = Column(Numeric(10, 2), nullable=False, default=0)
    actual_hours = Column(Numeric(10, 2), nullable=False, default=0)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])
    expenses = relationship("Expense", back_populates="task")
