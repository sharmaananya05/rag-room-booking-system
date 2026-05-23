from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType


class NotificationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    booking_id: str | None
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime