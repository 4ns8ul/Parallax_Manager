"""Expense Service — business logic for expense submission and approval workflow."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.expense_repo import ExpenseRepository
from app.repositories.project_repo import ProjectRepository
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.core.audit import log_audit
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseApproval
from app.services.notification_service import NotificationService


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.expense_repo = ExpenseRepository(db)
        self.project_repo = ProjectRepository(db)
        self.notification_service = NotificationService(db)

    async def create_expense(self, data: ExpenseCreate, employee_id: int, ip: str = None) -> Expense:
        expense = Expense(
            employee_id=employee_id,
            task_id=data.task_id,
            amount=data.amount,
            currency=data.currency,
            category=data.category,
            description=data.description,
        )
        expense = await self.expense_repo.create(expense)
        await log_audit(self.db, employee_id, "INSERT", "expenses", expense.id, ip_address=ip)
        return expense

    async def get_expense(self, expense_id: int) -> Expense:
        expense = await self.expense_repo.get_with_relations(expense_id)
        if not expense:
            raise NotFoundException("Expense")
        return expense

    async def list_expenses(self, skip=0, limit=100, user=None, user_roles=None, status=None):
        if user_roles and "ADMIN" in user_roles:
            expenses = await self.expense_repo.get_all_with_relations(skip, limit, status)
            total = await self.expense_repo.count_filtered(status)
        elif user_roles and "MANAGER" in user_roles:
            expenses = await self.expense_repo.get_all_with_relations(skip, limit, status)
            total = await self.expense_repo.count_filtered(status)
        else:
            expenses = await self.expense_repo.get_by_employee(user.id, skip, limit)
            total = await self.expense_repo.count_filtered(employee_id=user.id)
        return expenses, total

    async def update_expense(self, expense_id: int, data: ExpenseUpdate, user_id: int, ip: str = None) -> Expense:
        expense = await self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense")

        # Only the submitter can update, and only if still SUBMITTED
        if expense.employee_id != user_id:
            raise ForbiddenException("You can only update your own expenses.")
        if expense.status != "SUBMITTED":
            raise BadRequestException("Only expenses with status 'SUBMITTED' can be updated.")

        changes = {}
        for field, value in data.model_dump(exclude_unset=True).items():
            old_val = getattr(expense, field)
            if old_val != value:
                changes[field] = {"old": str(old_val), "new": str(value)}
                setattr(expense, field, value)

        expense = await self.expense_repo.update(expense)
        if changes:
            await log_audit(self.db, user_id, "UPDATE", "expenses", expense.id, changes=changes, ip_address=ip)
        return expense

    async def approve_or_reject(self, expense_id: int, data: ExpenseApproval, approver_id: int, user_roles=None, ip: str = None) -> Expense:
        """
        Approve or reject an expense. This is a transactional operation:
        1. Validate the expense is in SUBMITTED status
        2. Validate the approver has authority
        3. Update the expense status
        4. Create notification for the submitter
        All within a single DB transaction (ACID).
        """
        expense = await self.expense_repo.get_with_relations(expense_id)
        if not expense:
            raise NotFoundException("Expense")

        if expense.status != "SUBMITTED":
            raise BadRequestException(f"Cannot {data.action.lower()} an expense that is already '{expense.status}'.")

        # Employees cannot approve expenses
        if user_roles and "ADMIN" not in user_roles and "MANAGER" not in user_roles:
            raise ForbiddenException("Only managers and admins can approve or reject expenses.")

        # Update expense status
        old_status = expense.status
        expense.status = data.action
        expense.approved_by = approver_id
        expense.approved_at = datetime.now(timezone.utc)

        expense = await self.expense_repo.update(expense)

        await log_audit(
            self.db, approver_id, "UPDATE", "expenses", expense.id,
            changes={"status": {"old": old_status, "new": data.action}},
            ip_address=ip,
        )

        # Notify the submitter
        action_word = "approved" if data.action == "APPROVED" else "rejected"
        await self.notification_service.create_notification(
            recipient_id=expense.employee_id,
            title=f"Expense {action_word.capitalize()}",
            message=f"Your expense claim of {expense.currency} {expense.amount} has been {action_word}.",
            notif_type="EXPENSE_APPROVAL",
        )

        return expense

    async def delete_expense(self, expense_id: int, user_id: int, ip: str = None):
        expense = await self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense")
        if expense.employee_id != user_id:
            raise ForbiddenException("You can only delete your own expenses.")
        if expense.status != "SUBMITTED":
            raise BadRequestException("Only expenses with status 'SUBMITTED' can be deleted.")
        await self.expense_repo.delete(expense)
        await log_audit(self.db, user_id, "DELETE", "expenses", expense_id, ip_address=ip)

    async def update_bill_image(self, expense_id: int, image_url: str, user_id: int):
        expense = await self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense")
        if expense.employee_id != user_id:
            raise ForbiddenException("You can only update your own expenses.")
        expense.bill_image_url = image_url
        await self.expense_repo.update(expense)
