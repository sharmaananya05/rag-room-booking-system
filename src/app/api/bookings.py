from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.core.permissions import require_roles
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.booking import BookingRepository
from app.schemas.booking import BookingCreate, BookingDetailResponse, BookingResponse
from app.schemas.approval import ApprovalHistoryResponse
from app.repositories.approval_history import ApprovalHistoryRepository
from app.services.booking import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Faculty only — submit a new room booking request."""
    require_roles(UserRole.faculty)(current_user)
    print(data)
    return await BookingService(db).create(data, current_user.id)


@router.get("/", response_model=list[BookingResponse])
async def list_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Role-based list:
      - faculty/student → own bookings
      - hod             → all pending_hod bookings
      - admin_assistant → all pending_admin bookings
      - dean            → all pending_dean bookings
    """
    return await BookingRepository(db).list_for_role(current_user.role, current_user.id)


@router.get("/all", response_model=list[BookingResponse])
async def list_all_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full history — dean and admin_assistant only."""
    require_roles(UserRole.dean, UserRole.admin_assistant)(current_user)
    return await BookingRepository(db).list_all()


@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = await BookingRepository(db).get_with_relations(booking_id)
    if not booking:
        raise NotFoundException("Booking not found")

    # Faculty/student can only see their own
    if current_user.role in (UserRole.faculty, UserRole.student):
        if booking.requester_id != current_user.id:
            raise NotFoundException("Booking not found")

    return booking


@router.get("/{booking_id}/history", response_model=list[ApprovalHistoryResponse])
async def get_approval_history(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full approval trail for a booking."""
    booking = await BookingRepository(db).get_by_id(booking_id)
    if not booking:
        raise NotFoundException("Booking not found")
    return await ApprovalHistoryRepository(db).list_by_booking(booking_id)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Requester can cancel their own booking if not yet fully approved."""
    require_roles(UserRole.faculty)(current_user)
    await BookingService(db).cancel(booking_id, current_user.id)