from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.task import task_repo
from app.repositories.audit import audit_repo
from app.services.notification import notification_service
from app.models.tasks import Task
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskStatusUpdate
from decimal import Decimal

class TaskService:
    async def get_tasks(self, db: AsyncSession, user_id: int, roles: List[str]) -> List[Task]:
        """
        Scops task listings: ADMIN sees all, MANAGER sees projects they manage, EMPLOYEE sees assigned tasks.
        """
        if "ADMIN" in roles:
            return await task_repo.get_all(db)
        elif "MANAGER" in roles:
            return await task_repo.get_by_manager(db, user_id)
        else:
            return await task_repo.get_by_assignee(db, user_id)

    async def get_task_by_id(self, db: AsyncSession, task_id: int) -> Optional[Task]:
        return await task_repo.get(db, task_id)

    async def create_task(self, db: AsyncSession, current_user_id: int, task_data: TaskCreate) -> Task:
        """
        Initialize a new project task, notify the assigned developer, and log audit details.
        """
        payload = task_data.model_dump()
        
        # Parse decimal parameters
        payload["est_hours"] = float(payload["est_hours"])
        payload["actual_hours"] = float(payload["actual_hours"])

        task = await task_repo.create(db, payload)

        # Dispatch system alert to assignee
        await notification_service.create_notification(
            db=db,
            recipient_id=task.assignee_id,
            title="New Task Assigned",
            message=f"You have been assigned to task: '{task.title}' under project ID: {task.project_id}.",
            type="TASK_ASSIGNED"
        )

        # Record audit trail
        audit_payload = payload.copy()
        if audit_payload.get("due_date"):
            audit_payload["due_date"] = str(audit_payload["due_date"])

        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="INSERT",
            resource="Tasks",
            resource_id=task.id,
            changes=audit_payload
        )
        return await task_repo.get(db, task.id)

    async def update_task(
        self, db: AsyncSession, current_user_id: int, task_id: int, task_data: TaskUpdate
    ) -> Optional[Task]:
        """
        Update task metadata, dispatch updates to assignee, and record changes.
        """
        task = await task_repo.get(db, task_id)
        if not task:
            return None

        old_values = {
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "assignee_id": task.assignee_id,
            "est_hours": float(task.est_hours),
            "actual_hours": float(task.actual_hours),
            "due_date": str(task.due_date) if task.due_date else None
        }

        payload = task_data.model_dump(exclude_unset=True)
        if "est_hours" in payload:
            payload["est_hours"] = float(payload["est_hours"])
        if "actual_hours" in payload:
            payload["actual_hours"] = float(payload["actual_hours"])
        if "due_date" in payload and payload["due_date"]:
            payload["due_date"] = payload["due_date"]  # Date object is fine for repo

        updated_task = await task_repo.update(db, task, payload)

        # Send alert if assignee changes
        if "assignee_id" in payload and payload["assignee_id"] != old_values["assignee_id"]:
            await notification_service.create_notification(
                db=db,
                recipient_id=updated_task.assignee_id,
                title="Task Assignment Transferred",
                message=f"Task: '{updated_task.title}' has been transferred to you.",
                type="TASK_ASSIGNED"
            )

        # Record audit trail
        audit_payload = payload.copy()
        if "due_date" in audit_payload and audit_payload["due_date"]:
            audit_payload["due_date"] = str(audit_payload["due_date"])
            
        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="UPDATE",
            resource="Tasks",
            resource_id=task_id,
            changes={"from": old_values, "to": audit_payload}
        )
        return updated_task

    async def update_status(self, db: AsyncSession, current_user_id: int, task_id: int, new_status: str) -> Optional[Task]:
        """
        Update the task status state. If transition to 'DONE' completes, notify the project manager.
        """
        task = await task_repo.get(db, task_id)
        if not task:
            return None

        old_status = task.status
        updated_task = await task_repo.update(db, task, {"status": new_status})

        # Notify project manager if a task is marked DONE
        if new_status == "DONE" and old_status != "DONE":
            # Load project to find manager
            project = updated_task.project
            if project:
                await notification_service.create_notification(
                    db=db,
                    recipient_id=project.manager_id,
                    title="Task Completed",
                    message=f"Task: '{updated_task.title}' under project: '{project.name}' has been marked DONE by the assignee.",
                    type="TASK_COMPLETED"
                )

        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="UPDATE_STATUS",
            resource="Tasks",
            resource_id=task_id,
            changes={"from_status": old_status, "to_status": new_status}
        )
        return updated_task

    async def log_time(self, db: AsyncSession, current_user_id: int, task_id: int, hours_to_add: Decimal) -> Optional[Task]:
        """
        Add work hours logged on a task.
        """
        task = await task_repo.get(db, task_id)
        if not task:
            return None

        old_actual = float(task.actual_hours)
        new_actual = float(task.actual_hours + hours_to_add)

        updated_task = await task_repo.update(db, task, {"actual_hours": Decimal(str(new_actual))})

        await audit_repo.log_action(
            db=db,
            user_id=current_user_id,
            action="LOG_TIME",
            resource="Tasks",
            resource_id=task_id,
            changes={"logged_hours": float(hours_to_add), "previous_actual": old_actual, "new_actual": new_actual}
        )
        return updated_task

task_service = TaskService()
