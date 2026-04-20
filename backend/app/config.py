from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/postgres"
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()


@lru_cache
def get_settings():
    return Settings()