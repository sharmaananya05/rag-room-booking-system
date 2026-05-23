from datetime import datetime, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import RoomBooking
from app.models.enums import BookingStatus, UserRole
from app.repositories.base import BaseRepository

ACTIVE_STATUSES = [
    BookingStatus.pending_hod,
    BookingStatus.pending_admin,
    BookingStatus.pending_dean,
    BookingStatus.dean_approved,
]

class BookingRepository(BaseRepository[RoomBooking]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(RoomBooking, db)

    async def get_with_relations(self, booking_id: str) -> RoomBooking | None:
        result = await self.db.execute(
            select(RoomBooking)
            .options(
                selectinload(RoomBooking.room),
                selectinload(RoomBooking.requester),
                selectinload(RoomBooking.requester_department),
                selectinload(RoomBooking.faculty_incharge),
                selectinload(RoomBooking.student_coordinator),
                selectinload(RoomBooking.faculty_supervisor),
                selectinload(RoomBooking.approval_history),
            )
            .where(RoomBooking.id == booking_id)
        )
        return result.scalar_one_or_none()

    async def check_conflict(
    self,
    room_id: str,
    start: datetime,
    end: datetime,
    exclude_id: str | None = None,
    ) -> bool:
        # Strip tzinfo — column is TIMESTAMP WITHOUT TIME ZONE
        if start.tzinfo is not None:
            start = start.astimezone(timezone.utc).replace(tzinfo=None)
        if end.tzinfo is not None:
            end = end.astimezone(timezone.utc).replace(tzinfo=None)

        query = select(RoomBooking).where(
            and_(
                RoomBooking.room_id == room_id,
                RoomBooking.status.in_(ACTIVE_STATUSES),
                RoomBooking.start_datetime < end,
                RoomBooking.end_datetime > start,
            )
        )
        if exclude_id:
            query = query.where(RoomBooking.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def list_by_requester(self, requester_id: str) -> list[RoomBooking]:
        result = await self.db.execute(
            select(RoomBooking)
            .options(selectinload(RoomBooking.room))
            .where(RoomBooking.requester_id == requester_id)
            .order_by(RoomBooking.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_status(self, status: BookingStatus) -> list[RoomBooking]:
        result = await self.db.execute(
            select(RoomBooking)
            .options(
                selectinload(RoomBooking.room),
                selectinload(RoomBooking.requester),
            )
            .where(RoomBooking.status == status)
            .order_by(RoomBooking.created_at.asc())
        )
        return list(result.scalars().all())

    async def list_for_role(self, role: UserRole, user_id: str) -> list[RoomBooking]:
        """
        Role-based filtering:
          - faculty/student → their own bookings
          - hod             → all bookings pending their review
          - admin_assistant → bookings that passed HOD
          - dean            → bookings that passed admin
        """
        role_status_map = {
            UserRole.hod: BookingStatus.pending_hod,
            UserRole.admin_assistant: BookingStatus.pending_admin,
            UserRole.dean: BookingStatus.pending_dean,
        }

        if role in role_status_map:
            return await self.list_by_status(role_status_map[role])

        # faculty / student see only their own
        return await self.list_by_requester(user_id)

    async def list_all(self) -> list[RoomBooking]:
        result = await self.db.execute(
            select(RoomBooking)
            .options(
                selectinload(RoomBooking.room),
                selectinload(RoomBooking.requester),
            )
            .order_by(RoomBooking.created_at.desc())
        )
        return list(result.scalars().all())