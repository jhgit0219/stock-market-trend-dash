from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    alpha_vantage_api_key: Optional[str] = None
    allowed_origin_regex: str = r"^http://localhost:\d+$|^http://127\.0\.0\.1:\d+$"
    history_cache_ttl_seconds: int = 86400  # 24 hours
    list_cache_ttl_seconds: int = 3600  # 1 hour


settings = Settings()
