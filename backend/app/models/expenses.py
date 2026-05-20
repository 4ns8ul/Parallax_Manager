from sqlalchemy import Column, BIGINT, String, ForeignKey, DateTime, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(BIGINT, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(BIGINT, ForeignKey("users.id"), nullable=False)
    project_id = Column(BIGINT, ForeignKey("projects.id"), nullable=False)
    task_id = Column(BIGINT, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    amount = Column(DECIMAL(18, 4), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    category = Column(String(100), nullable=False)  # TRAVEL, MEALS, ACCOMMODATION, SOFTWARE, OTHER
    description = Column(String, nullable=False)  # Maps to NVARCHAR(MAX) in MS SQL
    status = Column(String(50), default="SUBMITTED", nullable=False)  # SUBMITTED, APPROVED, REJECTED
    bill_image_url = Column(String(512), nullable=True)
    approved_by = Column(BIGINT, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="expenses")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="approved_expenses")
    project = relationship("Project", back_populates="expenses")
    task = relationship("Task", back_populates="expenses")
