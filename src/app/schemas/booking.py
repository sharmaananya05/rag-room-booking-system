from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.enums import BookingStatus
from app.schemas.room import RoomResponse
from app.schemas.user import UserResponse


class BookingCreate(BaseModel):
    room_id: str
    requester_department_id: str
    purpose: str
    start_datetime: datetime
    end_datetime: datetime
    expected_attendees: int | None = None
    faculty_incharge_id: str
    student_coordinator_id: str
    faculty_supervisor_id: str

    @field_validator("end_datetime")
    @classmethod
    def end_after_start(cls, v: datetime, info: any) -> datetime:
        if "start_datetime" in info.data and v <= info.data["start_datetime"]:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class BookingResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    booking_reference: str

    room_id: str
    requester_id: str
    requester_department_id: str

    purpose: str
    start_datetime: datetime
    end_datetime: datetime
    expected_attendees: int | None

    room: RoomResponse

    faculty_incharge_id: str
    student_coordinator_id: str
    faculty_supervisor_id: str

    faculty_incharge: UserResponse
    student_coordinator: UserResponse
    faculty_supervisor: UserResponse

    status: BookingStatus
    submitted_at: datetime
    completed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime


class BookingDetailResponse(BookingResponse):
    room: RoomResponse
    requester: UserResponse