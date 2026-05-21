"""User Service — business logic for user CRUD and role management."""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repo import UserRepository, RoleRepository
from app.core.security import hash_password
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.audit import log_audit
from app.services.email_service import send_welcome_email
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)

    async def create_user(self, data: UserCreate, actor_id: int = None, ip: str = None) -> User:
        # Check for duplicate email
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictException(f"A user with email '{data.email}' already exists.")

        # Validate roles exist
        for role_id in data.role_ids:
            role = await self.role_repo.get_by_id(role_id)
            if not role:
                raise BadRequestException(f"Role with ID {role_id} does not exist.")

        import secrets
        import string

        must_change = False
        password = data.password
        if not password:
            # Auto-generate temporary password
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            password = ''.join(secrets.choice(alphabet) for i in range(12))
            must_change = True

            # Dispatch actual HTML email securely to their personal email
            import asyncio
            asyncio.create_task(send_welcome_email(data.personal_email, password))

        user = User(
            email=data.email,
            personal_email=data.personal_email,
            phone_number=data.phone_number,
            password_hash=hash_password(password),
            first_name=data.first_name,
            last_name=data.last_name,
            must_change_password=must_change,
        )
        user = await self.user_repo.create(user)

        # Assign roles
        if data.role_ids:
            await self.user_repo.assign_roles(user.id, data.role_ids)

        await log_audit(self.db, actor_id, "INSERT", "users", user.id, ip_address=ip)
        return user

    async def get_user(self, user_id: int) -> User:
        user = await self.user_repo.get_with_roles(user_id)
        if not user:
            raise NotFoundException("User")
        return user

    async def list_users(self, skip: int = 0, limit: int = 100):
        users = await self.user_repo.get_all_with_roles(skip, limit)
        total = await self.user_repo.count()
        return users, total

    async def update_user(self, user_id: int, data: UserUpdate, actor_id: int = None, ip: str = None) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")

        changes = {}
        if data.first_name is not None and data.first_name != user.first_name:
            changes["first_name"] = {"old": user.first_name, "new": data.first_name}
            user.first_name = data.first_name

        if data.last_name is not None and data.last_name != user.last_name:
            changes["last_name"] = {"old": user.last_name, "new": data.last_name}
            user.last_name = data.last_name
            
        if data.phone_number is not None and data.phone_number != user.phone_number:
            changes["phone_number"] = {"old": user.phone_number, "new": data.phone_number}
            user.phone_number = data.phone_number

        if data.status is not None and data.status != user.status:
            changes["status"] = {"old": user.status, "new": data.status}
            user.status = data.status
            
        if data.role_ids is not None:
            await self.update_user_roles(user.id, data.role_ids, actor_id=actor_id, ip=ip)

        user = await self.user_repo.update(user)
        if changes:
            await log_audit(self.db, actor_id, "UPDATE", "users", user.id, changes=changes, ip_address=ip)
        return user

    async def update_user_roles(self, user_id: int, role_ids: List[int], actor_id: int = None, ip: str = None):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")

        for role_id in role_ids:
            role = await self.role_repo.get_by_id(role_id)
            if not role:
                raise BadRequestException(f"Role with ID {role_id} does not exist.")

        await self.user_repo.assign_roles(user_id, role_ids)
        await log_audit(
            self.db, actor_id, "UPDATE", "user_roles", user_id,
            changes={"role_ids": role_ids}, ip_address=ip,
        )

    async def delete_user(self, user_id: int, actor_id: int = None, ip: str = None):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        await self.user_repo.delete(user)
        await log_audit(self.db, actor_id, "DELETE", "users", user_id, ip_address=ip)

    async def get_user_role_names(self, user_id: int) -> List[str]:
        return await self.user_repo.get_user_role_names(user_id)
