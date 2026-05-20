from app.controllers.auth import router as auth_router
from app.controllers.users import router as users_router
from app.controllers.projects import router as projects_router
from app.controllers.tasks import router as tasks_router
from app.controllers.expenses import router as expenses_router
from app.controllers.notifications import router as notifications_router
from app.controllers.reports import router as reports_router
from app.controllers.audit import router as audit_router

__all__ = [
    "auth_router",
    "users_router",
    "projects_router",
    "tasks_router",
    "expenses_router",
    "notifications_router",
    "reports_router",
    "audit_router"
]
