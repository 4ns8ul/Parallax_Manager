from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.audit import audit_repo
from app.schemas.audit import AuditLogOut
from app.services.auth import AuthService, TokenData
from typing import List

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
async def list_audit_logs(
    skip: int = 0,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Fetch system-wide audit logs. Restricted to ADMIN role.
    """
    if "ADMIN" not in token_data.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators can view audit logs."
        )
    return await audit_repo.get_all_with_users(db, skip=skip, limit=limit)
