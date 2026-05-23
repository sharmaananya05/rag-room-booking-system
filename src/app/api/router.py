from fastapi import APIRouter

from app.api import approvals, auth, bookings, notifications, rooms,user

router = APIRouter()
router.include_router(auth.router)
router.include_router(user.router)
router.include_router(rooms.router)
router.include_router(bookings.router)
router.include_router(approvals.router)
router.include_router(notifications.router)