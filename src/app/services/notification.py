from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import mail_templates as tmpl
from app.core.mail import send_email
from app.models.booking import RoomBooking
from app.models.enums import ApprovalAction, BookingStatus, NotificationType, UserRole
from app.models.notification import Notification
from app.models.user import User


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _push(
        self,
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        booking_id: str | None = None,
    ) -> None:
        self.db.add(Notification(
            user_id=user_id, booking_id=booking_id,
            type=type, title=title, message=message,
        ))

    async def _get_user(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def _get_users_by_role(self, role: UserRole) -> list[User]:
        result = await self.db.execute(select(User).where(
            User.role == role, User.is_active == True  # noqa: E712
        ))
        return list(result.scalars().all())

    def _room_label(self, booking: RoomBooking) -> str:
        room = booking.room
        if room:
            return f"{room.room_number}{' · ' + room.room_name if room.room_name else ''}"
        return booking.room_id 

    async def on_booking_submitted(self, booking: RoomBooking) -> None:
        ref     = booking.booking_reference
        room    = self._room_label(booking)
        start   = booking.start_datetime
        end     = booking.end_datetime
        purpose = booking.purpose

        requester = await self._get_user(booking.requester_id)
        hods      = await self._get_users_by_role(UserRole.hod)

        await self._push(
            booking.requester_id,
            NotificationType.booking_submitted,
            "Booking Submitted",
            f"Your booking {ref} has been submitted and is awaiting HOD approval.",
            booking.id,
        )

        if requester:
            subject, body = tmpl.booking_submitted_to_requester(
                requester.name, ref, room, start, end, purpose
            )
            await send_email([requester.email], subject, body)

        for hod in hods:
            subject, body = tmpl.booking_pending_hod(
                hod.name,
                requester.name if requester else "A faculty member",
                ref, room, start, end, purpose,
            )
            await send_email([hod.email], subject, body)

            await self._push(
                hod.id,
                NotificationType.approval_required,
                "Approval Required",
                f"Booking {ref} by {requester.name if requester else 'faculty'} needs your approval.",
                booking.id,
            )

    async def on_approval_action(
        self,
        booking: RoomBooking,
        action: ApprovalAction,
        approver: User,
    ) -> None:
        ref     = booking.booking_reference
        room    = self._room_label(booking)
        start   = booking.start_datetime
        end     = booking.end_datetime
        purpose = booking.purpose

        requester = await self._get_user(booking.requester_id)
        if not requester:
            return

        if action == ApprovalAction.rejected:
            await self._push(
                booking.requester_id,
                NotificationType.rejected,
                "Booking Rejected",
                f"Your booking {ref} was rejected by {approver.name}.",
                booking.id,
            )
            
            subject, body = tmpl.booking_rejected(
                requester.name, approver.name, approver.role.value,
                None, ref, room, start, end, purpose,
            )
            await send_email([requester.email], subject, body)
            return


        next_approvers: list[User] = []
        next_stage_label = ""

        if booking.status == BookingStatus.pending_admin:
            next_approvers = await self._get_users_by_role(UserRole.admin_assistant)
            next_stage_label = "Admin Assistant"

        elif booking.status == BookingStatus.pending_dean:
            next_approvers = await self._get_users_by_role(UserRole.dean)
            next_stage_label = "Dean / Registrar"

        elif booking.status == BookingStatus.dean_approved:
            await self._push(
                booking.requester_id,
                NotificationType.approved,
                "Booking Fully Approved ",
                f"Your booking {ref} has been fully approved by the Dean.",
                booking.id,
            )
            subject, body = tmpl.booking_fully_approved(
                requester.name, ref, room, start, end, purpose
            )
            await send_email([requester.email], subject, body)
            return

        await self._push(
            booking.requester_id,
            NotificationType.approved,
            f"Booking Approved — Pending {next_stage_label}",
            f"Your booking {ref} was approved by {approver.name} and is now pending {next_stage_label}.",
            booking.id,
        )
        subject, body = tmpl.booking_approved_stage(
            requester.name, approver.name, approver.role.value,
            next_stage_label, ref, room, start, end, purpose,
        )
        await send_email([requester.email], subject, body)

        for next_approver in next_approvers:
            await self._push(
                next_approver.id,
                NotificationType.approval_required,
                "Action Required: Booking Approval",
                f"Booking {ref} by {requester.name} is waiting for your approval.",
                booking.id,
            )
            subject, body = tmpl.booking_pending_approver(
                next_approver.name, next_approver.role.value,
                requester.name, ref, room, start, end, purpose,
            )
            await send_email([next_approver.email], subject, body)

    async def on_booking_cancelled(self, booking: RoomBooking) -> None:
        requester = await self._get_user(booking.requester_id)

        await self._push(
            booking.requester_id,
            NotificationType.cancelled,
            "Booking Cancelled",
            f"Your booking {booking.booking_reference} has been cancelled.",
            booking.id,
        )

        if requester:
            subject, body = tmpl.booking_cancelled(
                requester.name, booking.booking_reference,
                self._room_label(booking),
                booking.start_datetime, booking.end_datetime,
                booking.purpose,
            )
            await send_email([requester.email], subject, body)