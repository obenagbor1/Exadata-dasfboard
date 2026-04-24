"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # Oracle
    ORACLE_HOST: str
    ORACLE_PORT: int = 1521
    ORACLE_SERVICE: str
    ORACLE_USER: str
    ORACLE_PASSWORD: str
    ORACLE_WALLET_LOCATION: str | None = None
    ORACLE_CLIENT_LIB_DIR: str | None = None

    # App
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    METRIC_POLL_INTERVAL: int = 30
    FRONTEND_URL: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
