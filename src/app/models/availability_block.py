from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.room import Room
    from app.models.booking import RoomBooking


class RoomAvailabilityBlock(Base):
    __tablename__ = "room_availability_blocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("room_bookings.id", ondelete="CASCADE"), nullable=False)
    start_datetime: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    room: Mapped[Room] = relationship("Room", back_populates="availability_blocks")
    booking: Mapped[RoomBooking] = relationship("RoomBooking", back_populates="availability_blocks")

    __table_args__ = (
        Index("ix_availability_room_time_active", "room_id", "start_datetime", "end_datetime", "is_active"),
    )