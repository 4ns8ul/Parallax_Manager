import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient, ASGITransport

from app.database import Base, get_db
from main import app, seed_database
from app.config import settings
from app.services.auth import AuthService

# Use a separate SQLite database for integration/unit testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_tems.db"

# Create async engine for test database
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

# Async session factory for test database
TestingSessionLocal = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """
    Create custom event loop instance for the duration of the testing suite session.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Create database tables, seed roles/permissions/users, and teardown test database on completion.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with TestingSessionLocal() as session:
        await seed_database(session)
        
    yield
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide dynamic transaction-bound test sessions for direct database queries inside tests.
    """
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.fixture(autouse=True)
def override_db_dependency():
    """
    Inject testing session generator into the FastAPI app dependency graph.
    """
    async def _get_test_db():
        async with TestingSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
                
    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Provide stateless HTTP client targeting the testing FastAPI instance.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        yield ac

@pytest.fixture
async def admin_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Provide pre-authenticated Admin client using access token cookies.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        # admin email is seeded as admin@tems.com, user id 1
        access_token = AuthService.create_access_token(
            data={"sub": "1", "email": "admin@tems.com", "roles": ["ADMIN"], "permissions": []}
        )
        ac.cookies.set("access_token", access_token)
        yield ac

@pytest.fixture
async def manager_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Provide pre-authenticated Manager client.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        # manager is user id 2
        access_token = AuthService.create_access_token(
            data={
                "sub": "2", 
                "email": "manager@tems.com", 
                "roles": ["MANAGER"], 
                "permissions": ["project:read", "task:create", "task:read", "expense:submit", "expense:approve"]
            }
        )
        ac.cookies.set("access_token", access_token)
        yield ac

@pytest.fixture
async def employee_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Provide pre-authenticated Employee client.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        # employee is user id 3
        access_token = AuthService.create_access_token(
            data={
                "sub": "3", 
                "email": "employee@tems.com", 
                "roles": ["EMPLOYEE"], 
                "permissions": ["project:read", "task:read", "expense:submit"]
            }
        )
        ac.cookies.set("access_token", access_token)
        yield ac
