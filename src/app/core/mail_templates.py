from datetime import datetime


def _base(title: str, content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body {{ font-family: Inter, ui-sans-serif, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }}
        .wrapper {{ max-width: 600px; margin: 40px auto; background: #fff;
                    border-radius: 16px; overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header  {{ background: linear-gradient(135deg,#0f172a,#4338ca);
                    padding: 32px 40px; color: #fff; }}
        .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }}
        .header p  {{ margin: 6px 0 0; font-size: 13px; opacity: .7; }}
        .body    {{ padding: 32px 40px; color: #1e293b; line-height: 1.6; }}
        .body h2 {{ margin: 0 0 16px; font-size: 17px; color: #0f172a; }}
        .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0;
                     border-radius: 10px; padding: 20px; margin: 20px 0; }}
        .info-box table {{ width: 100%; border-collapse: collapse; }}
        .info-box td {{ padding: 6px 0; font-size: 14px; }}
        .info-box td:first-child {{ color: #64748b; width: 40%; }}
        .info-box td:last-child  {{ font-weight: 600; color: #0f172a; }}
        .badge {{ display:inline-block; padding: 4px 12px; border-radius: 999px;
                  font-size: 12px; font-weight: 600; }}
        .badge-pending  {{ background:#fef9c3; color:#854d0e; }}
        .badge-approved {{ background:#dcfce7; color:#166534; }}
        .badge-rejected {{ background:#fee2e2; color:#991b1b; }}
        .footer  {{ padding: 20px 40px; background: #f8fafc;
                    font-size: 12px; color: #94a3b8; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🏛 College Room Booking</h1>
          <p>{title}</p>
        </div>
        <div class="body">
          {content}
        </div>
        <div class="footer">
          This is an automated message from the College Room Booking System.<br/>
          Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
    """


def _booking_table(ref: str, room: str, start: datetime, end: datetime, purpose: str) -> str:
    return f"""
    <div class="info-box">
      <table>
        <tr><td>Reference</td><td>{ref}</td></tr>
        <tr><td>Room</td><td>{room}</td></tr>
        <tr><td>Date</td><td>{start.strftime('%d %b %Y')}</td></tr>
        <tr><td>Time</td><td>{start.strftime('%I:%M %p')} – {end.strftime('%I:%M %p')}</td></tr>
        <tr><td>Purpose</td><td>{purpose}</td></tr>
      </table>
    </div>
    """


# ── Templates ──────────────────────────────────────────────────────────────────

def booking_submitted_to_requester(
    requester_name: str, ref: str, room: str,
    start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Booking Submitted — {ref}"
    body = _base(
        "Your booking has been submitted",
        f"""
        <h2>Hi {requester_name},</h2>
        <p>Your room booking request has been successfully submitted and is now
           <span class="badge badge-pending">Pending HOD Approval</span>.</p>
        {_booking_table(ref, room, start, end, purpose)}
        <p>You will receive an email at each stage of the approval process.</p>
        """,
    )
    return subject, body


def booking_pending_hod(
    hod_name: str, requester_name: str,
    ref: str, room: str, start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Action Required: Booking {ref} awaits your approval"
    body = _base(
        "A booking request needs your approval",
        f"""
        <h2>Hi {hod_name},</h2>
        <p><strong>{requester_name}</strong> has submitted a room booking request
           that requires your approval as HOD.</p>
        {_booking_table(ref, room, start, end, purpose)}
        <p>Please log in to the system to approve or reject this request.</p>
        """,
    )
    return subject, body


def booking_approved_stage(
    requester_name: str, approver_name: str, approver_role: str,
    next_stage: str, ref: str, room: str,
    start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Booking {ref} approved by {approver_role} — Moving to {next_stage}"
    body = _base(
        f"Booking approved — awaiting {next_stage}",
        f"""
        <h2>Hi {requester_name},</h2>
        <p>Good news! Your booking was <span class="badge badge-approved">Approved</span>
           by <strong>{approver_name}</strong> ({approver_role}).</p>
        <p>It is now pending approval from <strong>{next_stage}</strong>.</p>
        {_booking_table(ref, room, start, end, purpose)}
        """,
    )
    return subject, body


def booking_pending_approver(
    approver_name: str, approver_role: str, requester_name: str,
    ref: str, room: str, start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Action Required: Booking {ref} awaits your approval"
    body = _base(
        f"A booking request needs your approval as {approver_role}",
        f"""
        <h2>Hi {approver_name},</h2>
        <p>A room booking by <strong>{requester_name}</strong> has been forwarded
           to you for approval as <strong>{approver_role}</strong>.</p>
        {_booking_table(ref, room, start, end, purpose)}
        <p>Please log in to the system to review and approve or reject this request.</p>
        """,
    )
    return subject, body


def booking_fully_approved(
    requester_name: str, ref: str, room: str,
    start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Booking Confirmed — {ref} ✅"
    body = _base(
        "Your booking is fully approved!",
        f"""
        <h2>Congratulations, {requester_name}!</h2>
        <p>Your room booking has been <span class="badge badge-approved">Fully Approved</span>
           by the Dean/Registrar. Your room is confirmed.</p>
        {_booking_table(ref, room, start, end, purpose)}
        <p>Please ensure you follow all room usage guidelines.</p>
        """,
    )
    return subject, body


def booking_rejected(
    requester_name: str, rejected_by: str, role: str,
    comments: str | None, ref: str, room: str,
    start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Booking {ref} Rejected"
    comments_html = (
        f"<div class='info-box'><strong>Reason:</strong> {comments}</div>"
        if comments else ""
    )
    body = _base(
        "Your booking request was rejected",
        f"""
        <h2>Hi {requester_name},</h2>
        <p>Unfortunately your booking has been
           <span class="badge badge-rejected">Rejected</span>
           by <strong>{rejected_by}</strong> ({role}).</p>
        {_booking_table(ref, room, start, end, purpose)}
        {comments_html}
        <p>You may submit a new request if needed.</p>
        """,
    )
    return subject, body


def booking_cancelled(
    requester_name: str, ref: str, room: str,
    start: datetime, end: datetime, purpose: str,
) -> tuple[str, str]:
    subject = f"Booking {ref} Cancelled"
    body = _base(
        "Your booking has been cancelled",
        f"""
        <h2>Hi {requester_name},</h2>
        <p>Your booking has been <span class="badge badge-rejected">Cancelled</span>.</p>
        {_booking_table(ref, room, start, end, purpose)}
        """,
    )
    return subject, body