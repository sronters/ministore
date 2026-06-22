from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./minbasket.db"
    app_name: str = "MinBasket"
    app_description: str = "Сравнение цен на продукты"
    jwt_secret: str = "dev-secret-change-before-production"
    jwt_algorithm: str = "HS256"
    telegram_bot_token: str = ""
    telegram_bot_username: str = ""
    telegram_webapp_auth_ttl_seconds: int = 86400
    frontend_url: str = "http://localhost:3000"
    backend_cors_origins: str = Field(default="http://localhost:3000")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
