"""Central API v1 router — aggregates all module routers."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.projects import router as projects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(projects_router)
api_router.include_router(tasks_router)
api_router.include_router(expenses_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
