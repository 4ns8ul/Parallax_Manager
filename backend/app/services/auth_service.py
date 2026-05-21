"""
Auth Service — handles login, token generation, and refresh.
Business logic is here, not in the route handler (SRP).
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repo import UserRepository
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_refresh_token
from app.core.exceptions import UnauthorizedException, BadRequestException
from app.core.audit import log_audit


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def login(self, email: str, password: str, ip_address: str = None):
        """
        Authenticate user and return tokens.
        Validates credentials against bcrypt hash — timing-safe comparison.
        """
        user = await self.user_repo.get_by_email(email)

        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password.")

        if user.status != "ACTIVE":
            raise UnauthorizedException("Account is suspended or inactive. Contact your administrator.")

        # Get user roles for token payload
        role_names = await self.user_repo.get_user_role_names(user.id)

        # Create tokens
        token_data = {"sub": str(user.id), "email": user.email, "roles": role_names}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Audit log
        await log_audit(
            self.db, user.id, "LOGIN", "users", user.id, ip_address=ip_address,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "must_change_password": user.must_change_password,
                "roles": role_names,
            },
        }

    async def refresh_tokens(self, refresh_token_str: str):
        """Generate new access token from a valid refresh token."""
        payload = decode_refresh_token(refresh_token_str)
        if payload is None:
            raise UnauthorizedException("Invalid or expired refresh token. Please log in again.")

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(int(user_id))
        if not user or user.status != "ACTIVE":
            raise UnauthorizedException("User not found or account deactivated.")

        role_names = await self.user_repo.get_user_role_names(user.id)
        token_data = {"sub": str(user.id), "email": user.email, "roles": role_names}
        new_access_token = create_access_token(token_data)

        return {"access_token": new_access_token}

    async def change_password(self, user_id: int, temp_password: str, new_password: str, ip_address: str = None):
        """Force a password change using a temporary password."""
        user = await self.user_repo.get_by_id(user_id)
        
        if not user or not verify_password(temp_password, user.password_hash):
            raise UnauthorizedException("Invalid temporary password.")
            
        user.password_hash = hash_password(new_password)
        user.must_change_password = False
        await self.user_repo.update(user)

        await log_audit(
            self.db, user.id, "UPDATE", "users", user.id, 
            changes={"password": "changed"}, ip_address=ip_address
        )
        return True
