from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, DateTime, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import ApprovalAction, ApproverRole

if TYPE_CHECKING:
    from app.models.booking import RoomBooking
    from app.models.user import User


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("room_bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    approver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    approver_role: Mapped[ApproverRole] = mapped_column(SAEnum(ApproverRole), nullable=False)
    action: Mapped[ApprovalAction] = mapped_column(SAEnum(ApprovalAction), nullable=False)
    comments: Mapped[str | None] = mapped_column(Text)
    action_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    booking: Mapped[RoomBooking] = relationship("RoomBooking", back_populates="approval_history")
    approver: Mapped[User] = relationship("User", back_populates="approval_history")