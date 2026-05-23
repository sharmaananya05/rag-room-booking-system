import random
import string
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, ConflictException, ForbiddenException, NotFoundException
from app.models.availability_block import RoomAvailabilityBlock
from app.models.booking import RoomBooking
from app.models.enums import AuditAction, BookingStatus
from app.repositories.booking import BookingRepository
from app.repositories.room import RoomRepository
from app.repositories.user import UserRepository
from app.schemas.booking import BookingCreate
from app.services.audit import AuditService
from app.services.notification import NotificationService


def _make_reference() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"BK{suffix}"

def _to_utc_naive(dt: datetime) -> datetime:
    """Convert to UTC then strip tzinfo — matches TIMESTAMP WITHOUT TIME ZONE columns."""
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


class BookingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BookingRepository(db)
        self.room_repo = RoomRepository(db)
        self.user_repo = UserRepository(db)
        self.audit = AuditService(db)
        self.notifications = NotificationService(db)

    async def create(self, data: BookingCreate, requester_id: str) -> RoomBooking:
        start = _to_utc_naive(data.start_datetime)
        end   = _to_utc_naive(data.end_datetime)
        now   = datetime.utcnow()  # also naive UTC to match

        room = await self.room_repo.get_by_id(data.room_id)
        if not room or not room.is_active:
            raise NotFoundException("Room not found or inactive")

        if start <= now:
            raise BadRequestException("Booking must be scheduled in the future")

        if end <= start:
            raise BadRequestException("End time must be after start time")

        if await self.repo.check_conflict(data.room_id, start, end):
            raise ConflictException("Room is already booked for the selected time slot")

        for field, uid in [
            ("faculty_incharge_id",    data.faculty_incharge_id),
            ("student_coordinator_id", data.student_coordinator_id),
            ("faculty_supervisor_id",  data.faculty_supervisor_id),
        ]:
            if not await self.user_repo.get_by_id(uid):
                raise NotFoundException(f"User for {field} not found: {uid}")

        booking = RoomBooking(
            booking_reference=_make_reference(),
            requester_id=requester_id,
            status=BookingStatus.pending_hod,
            room_id=data.room_id,
            requester_department_id=data.requester_department_id,
            purpose=data.purpose,
            start_datetime=start,   # ← naive UTC
            end_datetime=end,       # ← naive UTC
            expected_attendees=data.expected_attendees,
            faculty_incharge_id=data.faculty_incharge_id,
            student_coordinator_id=data.student_coordinator_id,
            faculty_supervisor_id=data.faculty_supervisor_id,
        )
        booking = await self.repo.create(booking)

        self.db.add(
            RoomAvailabilityBlock(
                room_id=booking.room_id,
                booking_id=booking.id,
                start_datetime=start,
                end_datetime=end,
            )
        )

        await self.audit.log(
            "room_bookings", booking.id, AuditAction.create,
            user_id=requester_id,
            new_values={"status": booking.status.value, "room_id": booking.room_id},
        )
        await self.notifications.on_booking_submitted(booking)

        return booking
    
    async def cancel(self, booking_id: str, requester_id: str) -> RoomBooking:
        booking = await self.repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")
        if booking.requester_id != requester_id:
            raise ForbiddenException("You can only cancel your own bookings")
        if booking.status in (BookingStatus.dean_approved, BookingStatus.cancelled):
            raise ConflictException(f"Cannot cancel a booking with status '{booking.status.value}'")

        old_status = booking.status.value
        booking.status = BookingStatus.cancelled
        booking.cancelled_at = datetime.now(timezone.utc)
        await self.db.flush()

        await self.audit.log(
            "room_bookings", booking.id, AuditAction.update,
            user_id=requester_id,
            old_values={"status": old_status},
            new_values={"status": "cancelled"},
        )
        await self.notifications.on_booking_cancelled(booking)
        return booking