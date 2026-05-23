from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.enums import UserRole
from app.models.room import Room
from app.models.user import User
from app.repositories.room import RoomRepository
from app.schemas.room import RoomCreate, RoomResponse

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("/", response_model=list[RoomResponse])
async def list_rooms(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),  # any authenticated user
):
    return await RoomRepository(db).list_active()


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.core.exceptions import NotFoundException
    room = await RoomRepository(db).get_by_id(room_id)
    if not room:
        raise NotFoundException("Room not found")
    return room


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    data: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin assistant / Dean only."""
    require_roles(UserRole.admin_assistant, UserRole.dean)(current_user)
    from app.core.exceptions import ConflictException
    repo = RoomRepository(db)
    if await repo.get_by_room_number(data.room_number):
        raise ConflictException(f"Room number '{data.room_number}' already exists")
    room = Room(**data.model_dump())
    return await repo.create(room)