"""
Authentication Schemas — strict validation for login/register payloads.
"""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request — email and password required, validated server-side."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")


class TokenResponse(BaseModel):
    """JWT token response after successful login."""
    access_token: str
    token_type: str = "bearer"
    user: "UserBrief"


class UserBrief(BaseModel):
    """Minimal user info returned with auth responses."""
    id: int
    email: str
    first_name: str
    last_name: str
    must_change_password: bool = False
    roles: list[str] = []

    model_config = {"from_attributes": True}


class RefreshResponse(BaseModel):
    """Response after token refresh."""
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    """Generic success message response."""
    success: bool = True
    message: str


class ChangePasswordRequest(BaseModel):
    """Payload for forcing a password change."""
    temp_password: str = Field(..., description="The temporary password sent via email")
    new_password: str = Field(..., min_length=8, max_length=128, description="The new strong password")
