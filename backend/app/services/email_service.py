"""
Email Service — manages asynchronous dispatch of emails via SMTP.
"""
import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from app.config import settings

# Configure FastMail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM or settings.MAIL_USERNAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_welcome_email(email: EmailStr, temp_password: str):
    """
    Sends a welcome email with a temporary password to a new employee.
    If SMTP credentials are not configured, it falls back to console logging.
    """
    if not settings.MAIL_SERVER or not settings.MAIL_PASSWORD:
        # Fallback to local console log if SMTP is empty in .env
        print(f"\n[MOCK EMAIL DISPATCH] To: {email}")
        print(f"[MOCK EMAIL DISPATCH] Subject: Welcome to Parallax - Account Created")
        print(f"[MOCK EMAIL DISPATCH] Body: Your temporary password is: {temp_password}\n")
        return

    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366F1;">Welcome to Parallax Enterprises</h2>
        <p>Your enterprise account has been created successfully.</p>
        <p>Please log in using your temporary credentials below. You will be prompted to set a permanent, secure password immediately.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #6366F1; margin: 20px 0;">
            <p style="margin: 0;"><strong>Username:</strong> {email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 16px;">{temp_password}</span></p>
        </div>
        <p>If you have any issues accessing your account, please contact your administrator.</p>
        <br/>
        <p>Thank you,<br/><strong>The Parallax IT Security Team</strong></p>
    </div>
    """
    
    message = MessageSchema(
        subject="Welcome to Parallax - Secure Account Credentials",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"[EMAIL SERVICE] Successfully sent welcome email to {email}")
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to {email}: {str(e)}")
