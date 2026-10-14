from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


def _parse_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/issueflow",
    )
    FRONTEND_ORIGINS: list[str] = _parse_csv(
        os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development-secret")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"}


settings = Settings()
