"""
PPET Application Configuration.
Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from .env file or environment variables."""

    # Application
    APP_NAME: str = "PPET"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "mssql+aioodbc://sa:YourPassword123@localhost:1433/ppet?driver=ODBC+Driver+17+for+SQL+Server"

    # JWT
    JWT_SECRET_KEY: str = "change-this-to-a-random-64-char-hex-string"
    JWT_REFRESH_SECRET_KEY: str = "change-this-to-another-random-64-char-hex-string"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # File Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # SMTP Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = ""
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
