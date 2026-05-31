import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    PRODUCT_HUNT_DEVELOPER_TOKEN: Optional[str] = None
    PRODUCT_HUNT_CLIENT_ID: Optional[str] = None
    PRODUCT_HUNT_CLIENT_SECRET: Optional[str] = None
    SYNC_INTERVAL_MINUTES: int = 30
    
    # Allow loading from a .env file if it exists
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
