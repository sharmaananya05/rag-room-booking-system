from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    email: EmailStr
    name: str
    phone: str | None
    role: UserRole
    department_id: str | None
    is_active: bool
    created_at: datetime