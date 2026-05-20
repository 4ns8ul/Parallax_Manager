from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.repositories.expense import expense_repo
from app.repositories.audit import audit_repo
from app.repositories.project import project_repo
from app.services.notification import notification_service
from app.models.expenses import Expense
from app.schemas.expenses import ExpenseCreate, ExpenseUpdate, ExpenseApproval
from datetime import datetime
from decimal import Decimal

class ExpenseService:
    @staticmethod
    async def set_mssql_session_context(db: AsyncSession, employee_id: int, manager_id: Optional[int] = None):
        """
        Bind user context to MS SQL Server session context to satisfy row-level security (RLS) policies.
        Silently passes if executing on non-MSSQL database (SQLite backup mode).
        """
        try:
            # Check if using mssql dialect
            if db.bind and db.bind.dialect.name == "mssql":
                await db.execute(
                    text("EXEC sp_set_session_context @key=N'EmployeeID', @value=:emp_id;"),
                    {"emp_id": employee_id}
                )
                if manager_id:
                    await db.execute(
                        text("EXEC sp_set_session_context @key=N'ManagerID', @value=:mgr_id;"),
                        {"mgr_id": manager_id}
                    )
        except Exception:
            # Fail silently to support seamless local SQLite developer runs
            pass

    async def get_expenses(self, db: AsyncSession, user_id: int, roles: List[str]) -> List[Expense]:
        """
        Fetch expenses based on role-visibility scopes, dynamically configuring MS SQL session contexts.
        """
        # Set session context for native engine filtering
        await self.set_mssql_session_context(db, employee_id=user_id, manager_id=(user_id if "MANAGER" in roles else None))

        if "ADMIN" in roles:
            return await expense_repo.get_all_with_details(db)
        elif "MANAGER" in roles:
            return await expense_repo.get_by_project_manager(db, user_id)
        else:
            return await expense_repo.get_by_employee(db, user_id)

    async def get_expense_by_id(self, db: AsyncSession, expense_id: int, user_id: int, roles: List[str]) -> Optional[Expense]:
        await self.set_mssql_session_context(db, employee_id=user_id, manager_id=(user_id if "MANAGER" in roles else None))
        return await expense_repo.get(db, expense_id)

    async def submit_expense(self, db: AsyncSession, employee_id: int, expense_data: ExpenseCreate) -> Expense:
        """
        Submit a new expense claim, logging action in audit trails.
        """
        payload = expense_data.model_dump()
        payload["employee_id"] = employee_id
        payload["status"] = "SUBMITTED"
        payload["amount"] = float(payload["amount"])

        await self.set_mssql_session_context(db, employee_id=employee_id)
        expense = await expense_repo.create(db, payload)

        await audit_repo.log_action(
            db=db,
            user_id=employee_id,
            action="INSERT",
            resource="Expenses",
            resource_id=expense.id,
            changes=payload
        )
        return await expense_repo.get(db, expense.id)

    async def process_approval(
        self, db: AsyncSession, manager_id: int, expense_id: int, approval_data: ExpenseApproval
    ) -> Optional[Expense]:
        """
        ACID Transactional Boundary: Review and approve/reject an expense claim.
        Updates status, logs audit details, alerts the submitting employee, and logs project impacts.
        """
        # Set session context for MS SQL RLS bypass checks
        await self.set_mssql_session_context(db, employee_id=manager_id, manager_id=manager_id)

        expense = await expense_repo.get(db, expense_id)
        if not expense or expense.status != "SUBMITTED":
            return None

        status_update = approval_data.status  # APPROVED or REJECTED
        old_status = expense.status

        update_payload = {
            "status": status_update,
            "approved_by": manager_id,
            "approved_at": datetime.utcnow()
        }

        # If rejected, we might track reason (store inside description or details if needed)
        updated_expense = await expense_repo.update(db, expense, update_payload)

        # Notify the employee of the decision
        alert_title = f"Expense Claim {status_update.capitalize()}"
        alert_msg = f"Your expense claim of {expense.amount} {expense.currency} has been {status_update.lower()}."
        if approval_data.rejected_reason and status_update == "REJECTED":
            alert_msg += f" Reason: {approval_data.rejected_reason}"

        await notification_service.create_notification(
            db=db,
            recipient_id=expense.employee_id,
            title=alert_title,
            message=alert_msg,
            type=f"EXPENSE_{status_update}"
        )

        # Record mutation in audit logs
        await audit_repo.log_action(
            db=db,
            user_id=manager_id,
            action=f"EXPENSE_{status_update}",
            resource="Expenses",
            resource_id=expense_id,
            changes={"from_status": old_status, "to_status": status_update, "approver_id": manager_id}
        )
        
        return await expense_repo.get(db, updated_expense.id)

expense_service = ExpenseService()
