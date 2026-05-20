from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text, BIGINT
from sqlalchemy.ext.compiler import compiles
from app.config import settings

# Global override to map BIGINT to INTEGER in SQLite to support autoincrement
@compiles(BIGINT, "sqlite")
def compile_bigint_sqlite(type_, compiler, **kw):
    return "INTEGER"

# Parse engine configurations
# For SQLite, check_same_thread=False is needed. For MS SQL Server, pool recycling is beneficial.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Initialize the async database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True only when debugging raw SQL queries
    connect_args=connect_args,
    pool_pre_ping=True  # Detect and discard stale database connections
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Declarative Base
Base = declarative_base()

# FastAPI database session dependency
async def get_db():
    """
    Asynchronous dependency to manage database session lifetimes.
    Yields an AsyncSession, wrapping requests in transactions, and safely closing connection on exit.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
