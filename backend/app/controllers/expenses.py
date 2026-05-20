from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.expense import expense_service
from app.services.project import project_service
from app.schemas.expenses import ExpenseCreate, ExpenseOut, ExpenseApproval
from app.services.auth import AuthService, PermissionChecker, TokenData
from typing import List

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseOut])
async def list_expenses(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    List all expense claims within the user's role-based visibility scope.
    """
    return await expense_service.get_expenses(db, token_data.user_id, token_data.roles)

@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Fetch specific expense claim details.
    """
    expense = await expense_service.get_expense_by_id(db, expense_id, token_data.user_id, token_data.roles)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense claim not found.")
    return expense

@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def submit_expense_claim(
    expense_in: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Submit a new expense claim. (Accessible to any authenticated employee)
    """
    # Verify that the project exists
    project = await project_service.get_project_by_id(db, expense_in.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    expense = await expense_service.submit_expense(db, token_data.user_id, expense_in)
    await db.commit()
    return expense

@router.post("/{expense_id}/approve", response_model=ExpenseOut)
async def process_expense_approval(
    expense_id: int,
    approval_in: ExpenseApproval,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(PermissionChecker("expense:approve"))
):
    """
    Approve or reject a submitted expense claim. (Restricted to Project Manager of project or ADMIN)
    """
    # Verify that the expense exists
    expense = await expense_service.get_expense_by_id(db, expense_id, token_data.user_id, token_data.roles)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense claim not found.")

    # Project Manager verification
    project = expense.project
    if "ADMIN" not in token_data.roles and (not project or project.manager_id != token_data.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only approve expenses for projects you manage."
        )

    updated_expense = await expense_service.process_approval(db, token_data.user_id, expense_id, approval_in)
    if not updated_expense:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense claim cannot be approved (already processed or invalid status)."
        )
        
    await db.commit()
    return updated_expense
