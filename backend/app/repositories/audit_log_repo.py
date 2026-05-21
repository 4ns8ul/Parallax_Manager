"""Audit Log Repository."""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.repositories.base import BaseRepository
from app.models.audit_log import AuditLog


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def get_recent(self, limit: int = 50) -> List[AuditLog]:
        result = await self.db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_resource(self, resource: str, resource_id: int) -> List[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.resource == resource, AuditLog.resource_id == resource_id)
            .order_by(AuditLog.created_at.desc())
        )
        return list(result.scalars().all())
