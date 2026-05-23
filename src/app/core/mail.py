from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import settings

_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

_mailer = FastMail(_conf)


async def send_email(to: list[str], subject: str, body: str) -> None:
    """Fire-and-forget HTML email. Errors are swallowed so they never break the main flow."""
    try:
        message = MessageSchema(
            subject=subject,
            recipients=to,
            body=body,
            subtype=MessageType.html,
        )

        await _mailer.send_message(message)
    except Exception as e:
        print(f"[MAIL ERROR] Failed to send to {to}: {e}")