"""
Database Seeder — populates the database with initial roles, permissions, and an admin user.
Run with: python -m seed
"""

import asyncio
from app.database import engine, async_session_factory, Base
from app.models.user import User, Role, Permission, UserRole, RolePermission
from app.core.security import hash_password

# All models must be imported for Base.metadata.create_all
import app.models  # noqa: F401


ROLES = [
    {"name": "ADMIN", "description": "Full system access — manage users, projects, roles, and view all reports."},
    {"name": "MANAGER", "description": "Manage assigned projects, create tasks, and approve expenses."},
    {"name": "EMPLOYEE", "description": "View assigned tasks, update progress, and submit expenses."},
]

PERMISSIONS = [
    # Auth
    {"name": "auth:login", "resource": "auth", "action": "login"},
    {"name": "auth:logout", "resource": "auth", "action": "logout"},
    # Users
    {"name": "user:create", "resource": "users", "action": "create"},
    {"name": "user:read", "resource": "users", "action": "read"},
    {"name": "user:update", "resource": "users", "action": "update"},
    {"name": "user:delete", "resource": "users", "action": "delete"},
    # Projects
    {"name": "project:create", "resource": "projects", "action": "create"},
    {"name": "project:read", "resource": "projects", "action": "read"},
    {"name": "project:update", "resource": "projects", "action": "update"},
    {"name": "project:delete", "resource": "projects", "action": "delete"},
    # Tasks
    {"name": "task:create", "resource": "tasks", "action": "create"},
    {"name": "task:read", "resource": "tasks", "action": "read"},
    {"name": "task:update", "resource": "tasks", "action": "update"},
    {"name": "task:assign", "resource": "tasks", "action": "assign"},
    {"name": "task:update_status", "resource": "tasks", "action": "update_status"},
    {"name": "task:delete", "resource": "tasks", "action": "delete"},
    # Expenses
    {"name": "expense:submit", "resource": "expenses", "action": "submit"},
    {"name": "expense:read", "resource": "expenses", "action": "read"},
    {"name": "expense:update", "resource": "expenses", "action": "update"},
    {"name": "expense:approve", "resource": "expenses", "action": "approve"},
    {"name": "expense:reject", "resource": "expenses", "action": "reject"},
    {"name": "expense:delete", "resource": "expenses", "action": "delete"},
    # Reports
    {"name": "report:dashboard", "resource": "reports", "action": "dashboard"},
    {"name": "report:generate", "resource": "reports", "action": "generate"},
    # Audit
    {"name": "audit:view", "resource": "audit", "action": "view"},
]

# Map role → permission names
ROLE_PERMISSIONS = {
    "ADMIN": [p["name"] for p in PERMISSIONS],  # All permissions
    "MANAGER": [
        "auth:login", "auth:logout",
        "project:read", "project:update",
        "task:create", "task:read", "task:update", "task:assign", "task:update_status",
        "expense:submit", "expense:read", "expense:update", "expense:approve", "expense:reject", "expense:delete",
        "report:dashboard", "report:generate",
    ],
    "EMPLOYEE": [
        "auth:login", "auth:logout",
        "project:read",
        "task:read", "task:update_status",
        "expense:submit", "expense:read", "expense:update", "expense:delete",
        "report:dashboard",
    ],
}

# Seed users
SEED_USERS = [
    {"email": "admin@prlx.com", "password": "Admin@1234", "first_name": "System", "last_name": "Admin", "role": "ADMIN"},
    {"email": "manager@prlx.com", "password": "Manager@1234", "first_name": "Priya", "last_name": "Sharma", "role": "MANAGER"},
    {"email": "manager2@prlx.com", "password": "Manager@1234", "first_name": "Rajesh", "last_name": "Kumar", "role": "MANAGER"},
    {"email": "employee1@prlx.com", "password": "Employee@1234", "first_name": "Ananya", "last_name": "Gupta", "role": "EMPLOYEE"},
    {"email": "employee2@prlx.com", "password": "Employee@1234", "first_name": "Vikram", "last_name": "Singh", "role": "EMPLOYEE"},
    {"email": "employee3@prlx.com", "password": "Employee@1234", "first_name": "Sneha", "last_name": "Patel", "role": "EMPLOYEE"},
]


async def seed():
    """Seed the database with initial data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if already seeded
        from sqlalchemy import select, func
        count = (await session.execute(select(func.count()).select_from(Role))).scalar_one()
        if count > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # 1. Create Roles
        role_map = {}
        for role_data in ROLES:
            role = Role(**role_data)
            session.add(role)
            await session.flush()
            role_map[role.name] = role.id
            print(f"  Created role: {role.name} (id={role.id})")

        # 2. Create Permissions
        perm_map = {}
        for perm_data in PERMISSIONS:
            perm = Permission(**perm_data)
            session.add(perm)
            await session.flush()
            perm_map[perm.name] = perm.id

        print(f"  Created {len(PERMISSIONS)} permissions.")

        # 3. Map Roles → Permissions
        for role_name, perm_names in ROLE_PERMISSIONS.items():
            for perm_name in perm_names:
                session.add(RolePermission(
                    role_id=role_map[role_name],
                    permission_id=perm_map[perm_name],
                ))
        await session.flush()
        print("  Mapped role permissions.")

        # 4. Create Users
        for user_data in SEED_USERS:
            user = User(
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
            )
            session.add(user)
            await session.flush()

            # Assign role
            session.add(UserRole(user_id=user.id, role_id=role_map[user_data["role"]]))
            print(f"  Created user: {user_data['email']} ({user_data['role']})")

        await session.commit()
        print("\nDatabase seeded successfully!")
        print("\nLogin credentials:")
        for u in SEED_USERS:
            print(f"  {u['email']} / {u['password']} ({u['role']})")


if __name__ == "__main__":
    asyncio.run(seed())
