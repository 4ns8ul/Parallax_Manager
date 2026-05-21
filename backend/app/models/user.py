"""
User, Role, Permission models and their many-to-many mapping tables.
Implements the RBAC schema from the SRS.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column, BigInteger, Integer, String, DateTime, ForeignKey, Table, Boolean
)
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(Base):
    """Many-to-many mapping: Users ↔ Roles."""
    __tablename__ = "user_roles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class RolePermission(Base):
    """Many-to-many mapping: Roles ↔ Permissions."""
    __tablename__ = "role_permissions"

    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class User(Base):
    """
    Users table — stores employee credentials, account status, and registration details.
    Passwords are NEVER stored in plain text (bcrypt hash only).
    """
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    personal_email = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")
    must_change_password = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user_roles = relationship("UserRole", backref="user", lazy="selectin", cascade="all, delete-orphan")
    managed_projects = relationship("Project", back_populates="manager", foreign_keys="Project.manager_id")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assignee_id")
    submitted_expenses = relationship("Expense", back_populates="employee", foreign_keys="Expense.employee_id")
    notifications = relationship("Notification", back_populates="recipient", foreign_keys="Notification.recipient_id")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Role(Base):
    """Roles table — defines functional access levels (ADMIN, MANAGER, EMPLOYEE)."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    role_permissions = relationship("RolePermission", backref="role", lazy="selectin", cascade="all, delete-orphan")


class Permission(Base):
    """Permissions table — granular actions on system resources (e.g., 'task:assign', 'expense:approve')."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    resource = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
