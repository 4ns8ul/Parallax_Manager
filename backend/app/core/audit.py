"""
Audit Logging Utility.
Records all significant mutations for compliance and debugging.
"""

from typing import Optional, Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession


async def log_audit(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    resource: str,
    resource_id: int,
    changes: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
):
    """
    Create an audit log entry. Called from service layer after mutations.

    Args:
        db: Active database session (within the same transaction).
        user_id: ID of the user performing the action (None for system actions).
        action: The operation type ('INSERT', 'UPDATE', 'DELETE').
        resource: The table/entity name (e.g., 'tasks', 'expenses').
        resource_id: Primary key of the affected record.
        changes: JSON-serializable dict of changed fields (old → new).
        ip_address: Client IP address from the request.
    """
    # Import here to avoid circular imports
    from app.models.audit_log import AuditLog
    import json

    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        changes=json.dumps(changes) if changes else None,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    # Don't commit here — let the caller's transaction handle it (ACID)
