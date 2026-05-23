from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def list_by_role(self, role: UserRole) -> list[User]:
        result = await self.db.execute(select(User).where(User.role == role))
        return list(result.scalars().all())

    async def list_active(self) -> list[User]:
        result = await self.db.execute(select(User).where(User.is_active == True))  # noqa: E712
        return list(result.scalars().all())