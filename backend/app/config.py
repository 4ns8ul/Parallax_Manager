import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "TEMS_API")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Database Settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./tems_local.db"  # Defaults to SQLite local for quick evaluation
    )
    
    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback_extremely_secret_key_change_me_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

settings = Settings()
