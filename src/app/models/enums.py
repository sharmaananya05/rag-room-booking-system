import enum

class UserRole(str, enum.Enum):
    student = "student"
    faculty = "faculty"
    hod = "hod"
    admin_assistant = "admin_assistant"
    dean = "dean"

class BookingStatus(str, enum.Enum):
    pending_hod = "pending_hod"
    hod_approved = "hod_approved"
    hod_rejected = "hod_rejected"
    pending_admin = "pending_admin"
    admin_approved = "admin_approved"
    admin_rejected = "admin_rejected"
    pending_dean = "pending_dean"
    dean_approved = "dean_approved"
    dean_rejected = "dean_rejected"
    cancelled = "cancelled"

class ApprovalAction(str, enum.Enum):
    approved = "approved"
    rejected = "rejected"

class ApproverRole(str, enum.Enum):
    hod = "hod"
    admin_assistant = "admin_assistant"
    dean = "dean"

class NotificationType(str, enum.Enum):
    booking_submitted = "booking_submitted"
    approval_required = "approval_required"
    approved = "approved"
    rejected = "rejected"
    reminder = "reminder"
    cancelled = "cancelled"

class AuditAction(str, enum.Enum):
    create = "create"
    update = "update"
    delete = "delete"