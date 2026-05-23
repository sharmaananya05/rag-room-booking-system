"""initial schema

Revision ID: 7ad9c75ac08b
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7ad9c75ac08b"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. No-dependency tables first ─────────────────────────────────────────

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("table_name", sa.String(100), nullable=False),
        sa.Column("record_id", sa.String(36), nullable=False),
        sa.Column("action", sa.Enum("create", "update", "delete", name="auditaction"), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("old_values", sa.JSON(), nullable=True),
        sa.Column("new_values", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_table_record", "audit_logs", ["table_name", "record_id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    op.create_table(
        "rooms",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("room_number", sa.String(50), nullable=False),
        sa.Column("room_name", sa.String(255), nullable=True),
        sa.Column("building", sa.String(100), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("facilities", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("room_number"),
    )
    op.create_index("ix_rooms_room_number", "rooms", ["room_number"])
    op.create_index("ix_rooms_is_active", "rooms", ["is_active"])

    # ── 2. users — no FK to departments yet (cycle breaker) ───────────────────

    op.create_table(
        "users",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(15), nullable=True),
        sa.Column("role", sa.Enum("student", "faculty", "hod", "admin_assistant", "dean", name="userrole"), nullable=False),
        sa.Column("department_id", sa.String(36), nullable=True),   # FK added later
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_department_id", "users", ["department_id"])

    # ── 3. departments — references users(id) for hod_id ─────────────────────

    op.create_table(
        "departments",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(10), nullable=False),
        sa.Column("hod_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["hod_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_departments_code", "departments", ["code"])

    # ── 4. NOW add the users → departments FK (cycle resolved) ────────────────

    op.create_foreign_key(
        "fk_users_department_id",
        "users", "departments",
        ["department_id"], ["id"],
        ondelete="SET NULL",
    )

    # ── 5. room_bookings — references users, rooms, departments ───────────────

    op.create_table(
        "room_bookings",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("booking_reference", sa.String(20), nullable=False),
        sa.Column("room_id", sa.String(36), nullable=False),
        sa.Column("requester_id", sa.String(36), nullable=False),
        sa.Column("requester_department_id", sa.String(36), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("start_datetime", sa.DateTime(), nullable=False),
        sa.Column("end_datetime", sa.DateTime(), nullable=False),
        sa.Column("expected_attendees", sa.Integer(), nullable=True),
        sa.Column("faculty_incharge_id", sa.String(36), nullable=False),
        sa.Column("student_coordinator_id", sa.String(36), nullable=False),
        sa.Column("faculty_supervisor_id", sa.String(36), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending_hod", "hod_approved", "hod_rejected",
                "pending_admin", "admin_approved", "admin_rejected",
                "pending_dean", "dean_approved", "dean_rejected",
                "cancelled",
                name="bookingstatus",
            ),
            nullable=False,
        ),
        sa.Column("submitted_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["faculty_incharge_id"],    ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["faculty_supervisor_id"],  ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["requester_department_id"],["departments.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["requester_id"],           ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["room_id"],                ["rooms.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["student_coordinator_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_reference"),
    )
    op.create_index("ix_room_bookings_booking_reference", "room_bookings", ["booking_reference"])
    op.create_index("ix_room_bookings_requester_id",      "room_bookings", ["requester_id"])
    op.create_index("ix_room_bookings_room_id",           "room_bookings", ["room_id"])
    op.create_index("ix_room_bookings_status",            "room_bookings", ["status"])

    # ── 6. approval_history ───────────────────────────────────────────────────

    op.create_table(
        "approval_history",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("booking_id", sa.String(36), nullable=False),
        sa.Column("approver_id", sa.String(36), nullable=False),
        sa.Column("approver_role", sa.Enum("hod", "admin_assistant", "dean", name="approverrole"), nullable=False),
        sa.Column("action", sa.Enum("approved", "rejected", name="approvalaction"), nullable=False),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("action_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["approver_id"], ["users.id"],        ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["booking_id"],  ["room_bookings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_approval_history_booking_id",  "approval_history", ["booking_id"])
    op.create_index("ix_approval_history_approver_id", "approval_history", ["approver_id"])

    # ── 7. notifications ──────────────────────────────────────────────────────

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("booking_id", sa.String(36), nullable=True),
        sa.Column(
            "type",
            sa.Enum(
                "booking_submitted", "approval_required",
                "approved", "rejected", "reminder", "cancelled",
                name="notificationtype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["room_bookings.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"],    ["users.id"],         ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_created_at",  "notifications", ["created_at"])
    op.create_index("ix_notifications_user_read",   "notifications", ["user_id", "is_read"])

    # ── 8. room_availability_blocks ───────────────────────────────────────────

    op.create_table(
        "room_availability_blocks",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("room_id", sa.String(36), nullable=False),
        sa.Column("booking_id", sa.String(36), nullable=False),
        sa.Column("start_datetime", sa.DateTime(), nullable=False),
        sa.Column("end_datetime", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["booking_id"], ["room_bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["room_id"],    ["rooms.id"],         ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_availability_room_time_active",
        "room_availability_blocks",
        ["room_id", "start_datetime", "end_datetime", "is_active"],
    )


def downgrade() -> None:
    op.drop_table("room_availability_blocks")
    op.drop_table("notifications")
    op.drop_table("approval_history")
    op.drop_table("room_bookings")

    # Drop the deferred FK before dropping users/departments
    op.drop_constraint("fk_users_department_id", "users", type_="foreignkey")

    op.drop_table("departments")
    op.drop_table("users")
    op.drop_table("rooms")
    op.drop_table("audit_logs")

    # Drop enums
    sa.Enum(name="bookingstatus").drop(op.get_bind())
    sa.Enum(name="userrole").drop(op.get_bind())
    sa.Enum(name="approverrole").drop(op.get_bind())
    sa.Enum(name="approvalaction").drop(op.get_bind())
    sa.Enum(name="notificationtype").drop(op.get_bind())
    sa.Enum(name="auditaction").drop(op.get_bind())