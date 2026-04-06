from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    alpha_vantage_api_key: Optional[str] = None
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    history_cache_ttl_seconds: int = 86400  # 24 hours
    list_cache_ttl_seconds: int = 3600  # 1 hour

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v  # type: ignore[return-value]


settings = Settings()
