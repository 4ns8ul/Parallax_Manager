from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.audit import AuditLog
from typing import List, Dict, Any
import json

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    async def log_action(
        self,
        db: AsyncSession,
        user_id: int,
        action: str,
        resource: str,
        resource_id: int,
        changes: Dict[str, Any] = None,
        ip_address: str = None
    ) -> AuditLog:
        """
        Synthesize and commit a new audit log record tracing a mutation.
        """
        def custom_json_serializer(obj):
            from decimal import Decimal
            from datetime import datetime, date
            if isinstance(obj, Decimal):
                return float(obj)
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")

        changes_json = json.dumps(changes, default=custom_json_serializer) if changes else None
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            changes=changes_json,
            ip_address=ip_address
        )
        db.add(log_entry)
        await db.flush()
        return log_entry

    async def get_all_with_users(self, db: AsyncSession, skip: int = 0, limit: int = 200) -> List[AuditLog]:
        from sqlalchemy.future import select
        from sqlalchemy.orm import joinedload
        result = await db.execute(
            select(self.model)
            .options(joinedload(self.model.user))
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

audit_repo = AuditLogRepository()

