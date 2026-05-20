import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import engine, Base, AsyncSessionLocal
from app.config import settings
from app.controllers import (
    auth_router,
    users_router,
    projects_router,
    tasks_router,
    expenses_router,
    notifications_router,
    reports_router,
    audit_router
)
from app.models.users import Role, Permission, User
from app.services.auth import AuthService
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TEMS_BOOTSTRAP")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Modern lifespan context manager for startup/shutdown events.
    """
    logger.info("Executing startup bootstrap procedures...")
    async with engine.begin() as conn:
        # Create all tables if they do not exist
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas migrated successfully.")
        
    async with AsyncSessionLocal() as session:
        await seed_database(session)
    
    yield  # Application runs here
    
    # Shutdown cleanup (if needed) goes here
    logger.info("TEMS API shutting down.")

app = FastAPI(
    title="TEMS API",
    description="Task & Expense Management System (TEMS) Backend Service for Apex Global Consulting Group",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, lock this down to specific domains e.g., ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Controller Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(expenses_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "app": "Task & Expense Management System (TEMS) API",
        "organization": "Apex Global Consulting Group",
        "version": "1.0.0"
    }

async def seed_database(db: AsyncSession):
    """
    Asynchronous bootstrap seeder to load initial roles, permissions, and accounts on startup.
    """
    logger.info("Initializing database seeding routine...")
    
    # 1. Seed Roles
    role_names = ["ADMIN", "MANAGER", "EMPLOYEE"]
    roles_dict = {}
    for name in role_names:
        result = await db.execute(select(Role).filter(Role.name == name).options(selectinload(Role.permissions)))
        role = result.scalars().first()
        if not role:
            role = Role(name=name, description=f"Standard role for {name.lower()}")
            role.permissions = []
            db.add(role)
            await db.flush()
            logger.info(f"Seeded role: {name}")
        roles_dict[name] = role

    # 2. Seed Permissions
    permissions_list = [
        {"name": "user:create", "resource": "users", "action": "create"},
        {"name": "user:read", "resource": "users", "action": "read"},
        {"name": "project:create", "resource": "projects", "action": "create"},
        {"name": "project:read", "resource": "projects", "action": "read"},
        {"name": "task:create", "resource": "tasks", "action": "create"},
        {"name": "task:read", "resource": "tasks", "action": "read"},
        {"name": "expense:submit", "resource": "expenses", "action": "submit"},
        {"name": "expense:approve", "resource": "expenses", "action": "approve"},
    ]
    
    perms_dict = {}
    for perm_data in permissions_list:
        result = await db.execute(select(Permission).filter(Permission.name == perm_data["name"]))
        perm = result.scalars().first()
        if not perm:
            perm = Permission(**perm_data)
            db.add(perm)
            await db.flush()
            logger.info(f"Seeded permission: {perm_data['name']}")
        perms_dict[perm_data["name"]] = perm

    # 3. Map Roles to Permissions
    # ADMIN gets all permissions
    admin_role = roles_dict["ADMIN"]
    for perm in perms_dict.values():
        if perm not in admin_role.permissions:
            admin_role.permissions.append(perm)
            
    # MANAGER gets project:read, task:create, task:read, expense:submit, expense:approve
    manager_role = roles_dict["MANAGER"]
    mgr_perms = ["project:read", "task:create", "task:read", "expense:submit", "expense:approve"]
    for name in mgr_perms:
        if perms_dict[name] not in manager_role.permissions:
            manager_role.permissions.append(perms_dict[name])

    # EMPLOYEE gets project:read, task:read, expense:submit
    employee_role = roles_dict["EMPLOYEE"]
    emp_perms = ["project:read", "task:read", "expense:submit"]
    for name in emp_perms:
        if perms_dict[name] not in employee_role.permissions:
            employee_role.permissions.append(perms_dict[name])

    await db.flush()

    # 4. Seed Default Users
    users_data = [
        {
            "email": "admin@tems.com",
            "first_name": "Apex",
            "last_name": "Admin",
            "role": "ADMIN"
        },
        {
            "email": "manager@tems.com",
            "first_name": "Sarah",
            "last_name": "Manager",
            "role": "MANAGER"
        },
        {
            "email": "employee@tems.com",
            "first_name": "John",
            "last_name": "Developer",
            "role": "EMPLOYEE"
        }
    ]

    for user_info in users_data:
        result = await db.execute(select(User).filter(User.email == user_info["email"]))
        user = result.scalars().first()
        if not user:
            hashed_pwd = AuthService.hash_password("Password123!")  # Premium default password
            user = User(
                email=user_info["email"],
                password_hash=hashed_pwd,
                first_name=user_info["first_name"],
                last_name=user_info["last_name"],
                status="ACTIVE"
            )
            user.roles = []
            db.add(user)
            await db.flush()
            
            # Map role
            user.roles.append(roles_dict[user_info["role"]])
            await db.flush()
            logger.info(f"Seeded user: {user_info['email']} with role: {user_info['role']}")

    await db.commit()
    logger.info("Database seeding routine completed successfully.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
