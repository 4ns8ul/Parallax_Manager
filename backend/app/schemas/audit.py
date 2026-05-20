from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.users import UserSummary

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource: str
    resource_id: int
    changes: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    user: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)
