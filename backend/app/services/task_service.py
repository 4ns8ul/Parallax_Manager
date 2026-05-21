"""Task Service — business logic for task CRUD and status transitions."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.task_repo import TaskRepository
from app.repositories.project_repo import ProjectRepository
from app.repositories.user_repo import UserRepository
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.core.audit import log_audit
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate
from app.services.notification_service import NotificationService


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)
        self.notification_service = NotificationService(db)

    async def create_task(self, data: TaskCreate, actor_id: int = None, user_roles=None, ip: str = None) -> Task:
        # Validate project exists
        project = await self.project_repo.get_by_id(data.project_id)
        if not project:
            raise BadRequestException(f"Project with ID {data.project_id} does not exist.")

        # Manager can only create tasks in their own projects
        if user_roles and "ADMIN" not in user_roles and project.manager_id != actor_id:
            raise ForbiddenException("You can only create tasks in projects you manage.")

        # Validate assignee exists
        assignee = await self.user_repo.get_by_id(data.assignee_id)
        if not assignee:
            raise BadRequestException(f"Assignee with ID {data.assignee_id} does not exist.")

        task = Task(
            project_id=data.project_id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            assignee_id=data.assignee_id,
            est_hours=data.est_hours,
            due_date=data.due_date,
        )
        task = await self.task_repo.create(task)
        await log_audit(self.db, actor_id, "INSERT", "tasks", task.id, ip_address=ip)

        # Notify assignee
        await self.notification_service.create_notification(
            recipient_id=data.assignee_id,
            title="New Task Assigned",
            message=f"You have been assigned to task '{data.title}' in project '{project.name}'.",
            notif_type="TASK_ASSIGNED",
        )

        return task

    async def get_task(self, task_id: int) -> Task:
        task = await self.task_repo.get_with_relations(task_id)
        if not task:
            raise NotFoundException("Task")
        return task

    async def list_tasks(self, skip=0, limit=100, user=None, user_roles=None, status=None, project_id=None):
        if user_roles and "ADMIN" in user_roles:
            tasks = await self.task_repo.get_all_with_relations(skip, limit, status, project_id)
            total = await self.task_repo.count_filtered(status, project_id)
        elif user_roles and "MANAGER" in user_roles:
            tasks = await self.task_repo.get_all_with_relations(skip, limit, status, project_id)
            total = await self.task_repo.count_filtered(status, project_id)
        else:
            # EMPLOYEE: only their own tasks
            tasks = await self.task_repo.get_by_assignee(user.id, skip, limit)
            total = len(tasks)
        return tasks, total

    async def update_task(self, task_id: int, data: TaskUpdate, actor_id: int = None, user_roles=None, ip: str = None) -> Task:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        changes = {}
        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            old_val = getattr(task, field)
            if old_val != value:
                changes[field] = {"old": str(old_val), "new": str(value)}
                setattr(task, field, value)

        task = await self.task_repo.update(task)
        if changes:
            await log_audit(self.db, actor_id, "UPDATE", "tasks", task.id, changes=changes, ip_address=ip)
        return task

    async def update_status(self, task_id: int, data: TaskStatusUpdate, actor_id: int = None, user_roles=None, ip: str = None) -> Task:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        # EMPLOYEE can only update status of their own tasks
        if user_roles and "ADMIN" not in user_roles and "MANAGER" not in user_roles:
            if task.assignee_id != actor_id:
                raise ForbiddenException("You can only update the status of tasks assigned to you.")

        changes = {"status": {"old": task.status, "new": data.status}}
        task.status = data.status

        if data.actual_hours is not None:
            changes["actual_hours"] = {"old": str(task.actual_hours), "new": str(data.actual_hours)}
            task.actual_hours = data.actual_hours

        task = await self.task_repo.update(task)
        await log_audit(self.db, actor_id, "UPDATE", "tasks", task.id, changes=changes, ip_address=ip)
        return task

    async def delete_task(self, task_id: int, actor_id: int = None, ip: str = None):
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")
        await self.task_repo.delete(task)
        await log_audit(self.db, actor_id, "DELETE", "tasks", task_id, ip_address=ip)
