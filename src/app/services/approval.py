from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.approval_history import ApprovalHistory
from app.models.enums import (
    AuditAction,
    ApprovalAction,
    ApproverRole,
    BookingStatus,
    UserRole,
)
from app.models.user import User
from app.repositories.booking import BookingRepository
from app.schemas.approval import ApprovalRequest
from app.services.audit import AuditService
from app.services.notification import NotificationService

TRANSITIONS: dict[tuple[BookingStatus, ApproverRole, ApprovalAction], BookingStatus] = {
    (BookingStatus.pending_hod,   ApproverRole.hod,             ApprovalAction.approved): BookingStatus.pending_admin,
    (BookingStatus.pending_hod,   ApproverRole.hod,             ApprovalAction.rejected): BookingStatus.hod_rejected,
    (BookingStatus.pending_admin, ApproverRole.admin_assistant, ApprovalAction.approved): BookingStatus.pending_dean,
    (BookingStatus.pending_admin, ApproverRole.admin_assistant, ApprovalAction.rejected): BookingStatus.admin_rejected,
    (BookingStatus.pending_dean,  ApproverRole.dean,            ApprovalAction.approved): BookingStatus.dean_approved,
    (BookingStatus.pending_dean,  ApproverRole.dean,            ApprovalAction.rejected): BookingStatus.dean_rejected,
}

USER_TO_APPROVER: dict[UserRole, ApproverRole] = {
    UserRole.hod:             ApproverRole.hod,
    UserRole.admin_assistant: ApproverRole.admin_assistant,
    UserRole.dean:            ApproverRole.dean,
}


class ApprovalService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BookingRepository(db)
        self.audit = AuditService(db)
        self.notifications = NotificationService(db)

    async def process(
        self, booking_id: str, approver: User, data: ApprovalRequest
    ) -> None:
        # 1. Resolve approver role
        approver_role = USER_TO_APPROVER.get(approver.role)
        if not approver_role:
            raise ForbiddenException("Your role is not part of the approval workflow")

        # 2. Fetch booking
        booking = await self.repo.get_with_relations(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        # 3. Look up valid transition
        key = (booking.status, approver_role, data.action)
        next_status = TRANSITIONS.get(key)
        if not next_status:
            raise BadRequestException(
                f"'{approver_role.value}' cannot perform '{data.action.value}' "
                f"on a booking with status '{booking.status.value}'"
            )

        old_status = booking.status

        # 4. Apply transition
        booking.status = next_status
        await self.db.flush()

        # 5. Record history
        self.db.add(
            ApprovalHistory(
                booking_id=booking.id,
                approver_id=approver.id,
                approver_role=approver_role,
                action=data.action,
                comments=data.comments,
            )
        )

        # 6. Audit + notify
        await self.audit.log(
            "room_bookings", booking.id, AuditAction.update,
            user_id=approver.id,
            old_values={"status": old_status.value},
            new_values={"status": next_status.value},
        )
        await self.notifications.on_approval_action(booking, data.action, approver)