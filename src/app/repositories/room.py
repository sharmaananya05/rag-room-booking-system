from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room
from app.repositories.base import BaseRepository


class RoomRepository(BaseRepository[Room]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Room, db)

    async def get_by_room_number(self, room_number: str) -> Room | None:
        result = await self.db.execute(
            select(Room).where(Room.room_number == room_number)
        )
        return result.scalar_one_or_none()

    async def list_active(self) -> list[Room]:
        result = await self.db.execute(select(Room).where(Room.is_active == True))  # noqa: E712
        return list(result.scalars().all())