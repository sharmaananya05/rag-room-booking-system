from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.approval_history import ApprovalHistory
from app.repositories.base import BaseRepository


class ApprovalHistoryRepository(BaseRepository[ApprovalHistory]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ApprovalHistory, db)

    async def list_by_booking(self, booking_id: str) -> list[ApprovalHistory]:
        result = await self.db.execute(
            select(ApprovalHistory)
            .options(selectinload(ApprovalHistory.approver))
            .where(ApprovalHistory.booking_id == booking_id)
            .order_by(ApprovalHistory.action_at.asc())
        )
        return list(result.scalars().all())