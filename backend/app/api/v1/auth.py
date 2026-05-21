"""Auth API routes — login, logout, refresh."""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse, RefreshResponse, MessageResponse, ChangePasswordRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    result = await service.login(data.email, data.password, ip_address=ip)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/api/v1/auth",
    )

    return TokenResponse(
        access_token=result["access_token"],
        user=result["user"],
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    """Refresh access token using the httpOnly refresh token cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        from app.core.exceptions import UnauthorizedException
        raise UnauthorizedException("No refresh token found. Please log in again.")

    service = AuthService(db)
    result = await service.refresh_tokens(refresh_token)
    return RefreshResponse(access_token=result["access_token"])


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Clear auth cookies."""
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    response.delete_cookie("access_token")
    return MessageResponse(message="Logged out successfully.")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest, 
    request: Request, 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Force password reset for new accounts using the temporary password."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    await service.change_password(current_user.id, data.temp_password, data.new_password, ip_address=ip)
    return MessageResponse(message="Password successfully changed.")
