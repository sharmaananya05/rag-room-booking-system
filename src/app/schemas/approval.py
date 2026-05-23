from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ApprovalAction, ApproverRole


class ApprovalRequest(BaseModel):
    action: ApprovalAction
    comments: str | None = None


class ApprovalHistoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    booking_id: str
    approver_id: str
    approver_role: ApproverRole
    action: ApprovalAction
    comments: str | None
    action_at: datetime