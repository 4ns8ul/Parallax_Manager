from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotificationOut(BaseModel):
    id: int
    recipient_id: int
    title: str
    message: str
    type: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
