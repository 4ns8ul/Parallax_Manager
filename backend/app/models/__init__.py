"""Models package — imports all models so Alembic and Base.metadata.create_all() discover them."""

from app.models.user import User, Role, Permission, UserRole, RolePermission
from app.models.project import Project, ProjectAssignment
from app.models.task import Task
from app.models.expense import Expense
from app.models.notification import Notification
from app.models.audit_log import AuditLog

__all__ = [
    "User", "Role", "Permission", "UserRole", "RolePermission",
    "Project", "ProjectAssignment",
    "Task",
    "Expense",
    "Notification",
    "AuditLog",
]
