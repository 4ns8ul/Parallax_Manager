from sqlalchemy import Column, BIGINT, String, ForeignKey, DateTime, DECIMAL, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(BIGINT, primary_key=True, index=True, autoincrement=True)
    project_id = Column(BIGINT, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=True)  # Maps to NVARCHAR(MAX) in MS SQL
    status = Column(String(50), default="TO_DO", nullable=False)  # TO_DO, IN_PROGRESS, BLOCKED, DONE
    priority = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    assignee_id = Column(BIGINT, ForeignKey("users.id"), nullable=False)
    est_hours = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    actual_hours = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    expenses = relationship("Expense", back_populates="task")
