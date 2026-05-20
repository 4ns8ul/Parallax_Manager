from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth import AuthService
from app.schemas.auth import LoginRequest, Token, TokenData
from app.repositories.user import user_repo

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(response: Response, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate employee credentials. If valid, issue JWT tokens and write access token to secure HTTPOnly cookies.
    """
    user = await AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Eagerly load roles and permissions mapping
    roles = [role.name for role in user.roles]
    permissions = await user_repo.get_permissions(db, user.id)

    # Generate JWT payloads
    token_claims = {
        "sub": str(user.id),
        "email": user.email,
        "roles": roles,
        "permissions": permissions
    }
    
    access_token = AuthService.create_access_token(data=token_claims)
    refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})

    # Set secure HTTPOnly cookie for the access token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="strict",
        secure=False,  # Set to True in HTTPS production environments
        max_age=15 * 60  # 15 minutes
    )

    # Resolve primary role to send to client
    primary_role = roles[0] if roles else "EMPLOYEE"

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=primary_role,
        email=user.email,
        user_id=user.id
    )

@router.post("/logout")
async def logout(response: Response):
    """
    Clear active employee session and invalidate cookies.
    """
    response.delete_cookie("access_token")
    return {"status": "SUCCESS", "message": "Logged out successfully. Secure cookies invalidated."}

@router.get("/me")
async def get_profile(
    token_data: TokenData = Depends(AuthService.get_current_user_data),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch details of the currently logged-in user profile.
    """
    user = await user_repo.get(db, token_data.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "roles": token_data.roles,
        "permissions": token_data.permissions
    }
