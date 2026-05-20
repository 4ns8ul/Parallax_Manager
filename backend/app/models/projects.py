from sqlalchemy import Column, BIGINT, String, ForeignKey, DateTime, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ProjectAssignment(Base):
    __tablename__ = "project_assignments"
    project_id = Column(BIGINT, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BIGINT, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Project(Base):
    __tablename__ = "projects"

    id = Column(BIGINT, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(String, nullable=True)  # Will map to NVARCHAR(MAX) in MS SQL
    status = Column(String(50), default="PLANNING", nullable=False)  # PLANNING, ACTIVE, COMPLETED
    manager_id = Column(BIGINT, ForeignKey("users.id"), nullable=False)
    total_budget = Column(DECIMAL(18, 4), nullable=False, default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_projects")
    members = relationship("User", secondary="project_assignments", back_populates="assigned_projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="project")
