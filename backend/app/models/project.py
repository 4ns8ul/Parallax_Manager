"""
Project and ProjectAssignment models.
Tracks corporate projects, budgets, and employee-project mappings.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, Numeric, CheckConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class ProjectAssignment(Base):
    """Many-to-many mapping: Projects ↔ Users (team members)."""
    __tablename__ = "project_assignments"

    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class Project(Base):
    """
    Projects table — corporate projects with budget allocations and owners.
    Budget is enforced to be >= 0 at the database level.
    """
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint("total_budget >= 0", name="chk_project_budget"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="PLANNING")
    manager_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    total_budget = Column(Numeric(18, 4), nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    manager = relationship("User", back_populates="managed_projects", foreign_keys=[manager_id])
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    assignments = relationship("ProjectAssignment", backref="project", lazy="selectin", cascade="all, delete-orphan")
