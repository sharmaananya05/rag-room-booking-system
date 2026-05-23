from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.enums import AuditAction


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log(
        self,
        table_name: str,
        record_id: str,
        action: AuditAction,
        user_id: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
        ip_address: str | None = None,
    ) -> None:
        self.db.add(
            AuditLog(
                table_name=table_name,
                record_id=record_id,
                action=action,
                user_id=user_id,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
            )
        )
        await self.db.flush()