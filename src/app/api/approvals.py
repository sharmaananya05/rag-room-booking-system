from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.approval import ApprovalRequest
from app.services.approval import ApprovalService

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.post("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def approve_or_reject(
    booking_id: str,
    data: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve or reject a booking.
      - HOD            → acts on pending_hod bookings
      - Admin Assistant → acts on pending_admin bookings
      - Dean           → acts on pending_dean bookings
    Any other role gets 403.
    """
    require_roles(UserRole.hod, UserRole.admin_assistant, UserRole.dean)(current_user)
    await ApprovalService(db).process(booking_id, current_user, data)