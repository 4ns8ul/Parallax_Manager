from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.repositories.user import user_repo
from app.repositories.audit import audit_repo
from app.models.users import User, Role
from app.schemas.users import UserCreate, UserOut, UserUpdate
from app.services.auth import AuthService, PermissionChecker, TokenData
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(PermissionChecker("user:read"))
):
    """
    List all registered employees (Restricted to Admin/Manager).
    """
    return await user_repo.get_all(db)

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(PermissionChecker("user:create"))
):
    """
    Register a new user, hash passwords via bcrypt, assign roles, and log audit log.
    (Restricted to ADMIN)
    """
    existing_user = await user_repo.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee email already registered."
        )

    # Hash passwords securely
    hashed_pwd = AuthService.hash_password(user_in.password)
    
    # Create User model
    user = User(
        email=user_in.email,
        password_hash=hashed_pwd,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        status="ACTIVE"
    )
    db.add(user)
    await db.flush()

    # Assign Roles
    for role_name in user_in.role_names:
        result = await db.execute(select(Role).filter(Role.name == role_name))
        role = result.scalars().first()
        if role:
            user.roles.append(role)

    await db.flush()
    await db.commit()  # Commit transaction
    
    # Log audit trace
    await audit_repo.log_action(
        db=db,
        user_id=token_data.user_id,
        action="INSERT",
        resource="Users",
        resource_id=user.id,
        changes={"email": user.email, "roles": user_in.role_names}
    )

    return user

@router.put("/{user_id}", response_model=UserOut)
async def update_user_profile(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(AuthService.get_current_user_data)
):
    """
    Update employee credentials or status. Users can self-update. Administrative role assignments require ADMIN.
    """
    # Enforce self-update or ADMIN boundaries
    if user_id != token_data.user_id and "ADMIN" not in token_data.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot modify other users' profiles."
        )

    user = await user_repo.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    payload = user_in.model_dump(exclude_unset=True)

    # If updating passwords, hash it
    if "password" in payload and payload["password"]:
        payload["password_hash"] = AuthService.hash_password(payload["password"])
        del payload["password"]

    # Assign roles (Admin only permission)
    if "role_names" in payload:
        if "ADMIN" not in token_data.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only Admins can modify role assignments."
            )
        
        user.roles.clear()  # Clear existing roles
        for role_name in payload["role_names"]:
            result = await db.execute(select(Role).filter(Role.name == role_name))
            role = result.scalars().first()
            if role:
                user.roles.append(role)
        del payload["role_names"]

    updated_user = await user_repo.update(db, user, payload)
    await db.commit()

    # Log to audit history
    await audit_repo.log_action(
        db=db,
        user_id=token_data.user_id,
        action="UPDATE",
        resource="Users",
        resource_id=user_id,
        changes={"updated_fields": list(payload.keys())}
    )

    return updated_user
