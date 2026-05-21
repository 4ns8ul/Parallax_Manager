"""Expense API routes."""

import os
import uuid
from fastapi import APIRouter, Depends, Request, Query, UploadFile, File
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.core.dependencies import require_roles, get_current_user
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseApproval, ExpenseResponse, ExpenseListResponse
from app.schemas.auth import MessageResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List expenses (RBAC-scoped)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)

    service = ExpenseService(db)
    skip = (page - 1) * page_size
    expenses, total = await service.list_expenses(skip, page_size, user=current_user, user_roles=user_roles, status=status)

    expense_responses = []
    for e in expenses:
        expense_responses.append(ExpenseResponse(
            id=e.id, employee_id=e.employee_id,
            employee_name=e.employee.full_name if e.employee else "",
            task_id=e.task_id,
            task_title=e.task.title if e.task else None,
            amount=e.amount, currency=e.currency, category=e.category,
            description=e.description, status=e.status,
            bill_image_url=e.bill_image_url,
            approved_by=e.approved_by,
            approver_name=e.approver.full_name if e.approver else None,
            approved_at=e.approved_at,
            created_at=e.created_at, updated_at=e.updated_at,
        ))

    return ExpenseListResponse(expenses=expense_responses, total=total, page=page, page_size=page_size)


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    data: ExpenseCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit a new expense claim."""
    service = ExpenseService(db)
    ip = request.client.host if request.client else None
    expense = await service.create_expense(data, employee_id=current_user.id, ip=ip)
    return ExpenseResponse(
        id=expense.id, employee_id=expense.employee_id,
        task_id=expense.task_id, amount=expense.amount,
        currency=expense.currency, category=expense.category,
        description=expense.description, status=expense.status,
        created_at=expense.created_at, updated_at=expense.updated_at,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get expense details."""
    service = ExpenseService(db)
    e = await service.get_expense(expense_id)
    return ExpenseResponse(
        id=e.id, employee_id=e.employee_id,
        employee_name=e.employee.full_name if e.employee else "",
        task_id=e.task_id,
        task_title=e.task.title if e.task else None,
        amount=e.amount, currency=e.currency, category=e.category,
        description=e.description, status=e.status,
        bill_image_url=e.bill_image_url,
        approved_by=e.approved_by,
        approver_name=e.approver.full_name if e.approver else None,
        approved_at=e.approved_at,
        created_at=e.created_at, updated_at=e.updated_at,
    )


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update expense (only submitter, only if SUBMITTED)."""
    service = ExpenseService(db)
    ip = request.client.host if request.client else None
    expense = await service.update_expense(expense_id, data, user_id=current_user.id, ip=ip)
    return ExpenseResponse(
        id=expense.id, employee_id=expense.employee_id,
        task_id=expense.task_id, amount=expense.amount,
        currency=expense.currency, category=expense.category,
        description=expense.description, status=expense.status,
        created_at=expense.created_at, updated_at=expense.updated_at,
    )


@router.patch("/{expense_id}/approve", response_model=ExpenseResponse)
async def approve_expense(
    expense_id: int,
    data: ExpenseApproval,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(["ADMIN", "MANAGER"])),
):
    """Approve or reject an expense (Admin or Manager)."""
    from app.services.user_service import UserService
    user_roles = await UserService(db).get_user_role_names(current_user.id)

    service = ExpenseService(db)
    ip = request.client.host if request.client else None
    e = await service.approve_or_reject(expense_id, data, approver_id=current_user.id, user_roles=user_roles, ip=ip)
    return ExpenseResponse(
        id=e.id, employee_id=e.employee_id,
        employee_name=e.employee.full_name if e.employee else "",
        task_id=e.task_id, amount=e.amount, currency=e.currency,
        category=e.category, description=e.description, status=e.status,
        approved_by=e.approved_by, approved_at=e.approved_at,
        created_at=e.created_at, updated_at=e.updated_at,
    )


@router.post("/{expense_id}/upload", response_model=MessageResponse)
async def upload_bill(
    expense_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload a receipt/bill image for an expense."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        from app.core.exceptions import BadRequestException
        raise BadRequestException(f"File type '{file.content_type}' is not allowed. Allowed: {', '.join(allowed_types)}")

    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        from app.core.exceptions import BadRequestException
        raise BadRequestException(f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.")

    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, "bills")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    # Update expense
    service = ExpenseService(db)
    image_url = f"/uploads/bills/{filename}"
    await service.update_bill_image(expense_id, image_url, current_user.id)

    return MessageResponse(message="Receipt uploaded successfully.")


@router.delete("/{expense_id}", response_model=MessageResponse)
async def delete_expense(
    expense_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete expense (only submitter, only if SUBMITTED)."""
    service = ExpenseService(db)
    ip = request.client.host if request.client else None
    await service.delete_expense(expense_id, user_id=current_user.id, ip=ip)
    return MessageResponse(message="Expense deleted successfully.")
