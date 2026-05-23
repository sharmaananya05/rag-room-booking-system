from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import BookingStatus

if TYPE_CHECKING:
    from app.models.room import Room
    from app.models.user import User
    from app.models.department import Department
    from app.models.approval_history import ApprovalHistory
    from app.models.availability_block import RoomAvailabilityBlock
    from app.models.notification import Notification


class RoomBooking(Base):
    __tablename__ = "room_bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_reference: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False, index=True)
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    requester_department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    start_datetime: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    expected_attendees: Mapped[int | None] = mapped_column(Integer)
    faculty_incharge_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    student_coordinator_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    faculty_supervisor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus), default=BookingStatus.pending_hod, nullable=False, index=True)
    submitted_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime)
    cancelled_at: Mapped[DateTime | None] = mapped_column(DateTime)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    room: Mapped[Room] = relationship("Room", back_populates="bookings")
    requester: Mapped[User] = relationship("User", foreign_keys=[requester_id], back_populates="bookings_requested")
    requester_department: Mapped[Department] = relationship("Department", back_populates="bookings")
    faculty_incharge: Mapped[User] = relationship("User", foreign_keys=[faculty_incharge_id], back_populates="bookings_as_faculty_incharge")
    student_coordinator: Mapped[User] = relationship("User", foreign_keys=[student_coordinator_id], back_populates="bookings_as_student_coordinator")
    faculty_supervisor: Mapped[User] = relationship("User", foreign_keys=[faculty_supervisor_id], back_populates="bookings_as_faculty_supervisor")
    approval_history: Mapped[list[ApprovalHistory]] = relationship("ApprovalHistory", back_populates="booking", cascade="all, delete-orphan")
    availability_blocks: Mapped[list[RoomAvailabilityBlock]] = relationship("RoomAvailabilityBlock", back_populates="booking", cascade="all, delete-orphan")
    notifications: Mapped[list[Notification]] = relationship("Notification", back_populates="booking")