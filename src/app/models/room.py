from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.booking import RoomBooking
    from app.models.availability_block import RoomAvailabilityBlock


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    room_name: Mapped[str | None] = mapped_column(String(255))
    building: Mapped[str | None] = mapped_column(String(100))
    floor: Mapped[int | None] = mapped_column(Integer)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    facilities: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    bookings: Mapped[list[RoomBooking]] = relationship("RoomBooking", back_populates="room")
    availability_blocks: Mapped[list[RoomAvailabilityBlock]] = relationship("RoomAvailabilityBlock", back_populates="room")