import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Guarding Grader Backend"
    ENV: str = "production"
    DEBUG: bool = False
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Supabase (Auth + DB)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # Redis Queue
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_QUEUE_NAME: str = "grader_submissions"
    
    # Rate Limiting & Abuse Prevention
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_SUBMIT: str = "10/minute"
    RATE_LIMIT_GENERAL: str = "60/minute"
    MAX_SOURCE_CODE_BYTES: int = 65536  # 64 KB
    MAX_CONCURRENT_JOBS_PER_USER: int = 2
    
    # Path settings
    PROBLEMS_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "problems"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
