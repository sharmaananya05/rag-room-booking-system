from datetime import datetime

from pydantic import BaseModel


class RoomCreate(BaseModel):
    room_number: str
    room_name: str | None = None
    building: str | None = None
    floor: int | None = None
    capacity: int
    facilities: str | None = None


class RoomResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    room_number: str
    room_name: str | None
    building: str | None
    floor: int | None
    capacity: int
    facilities: str | None
    is_active: bool
    created_at: datetime