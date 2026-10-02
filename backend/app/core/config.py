import os
import secrets
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "AI-Powered Study Assistant"
    DATABASE_URL: str = "postgresql://study_user:study_password@localhost:5432/study_assistant"
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    # Generate a private per-process development key instead of using a known default.
    # Render supplies a stable generated JWT_SECRET through render.yaml.
    JWT_SECRET: str = Field(default_factory=lambda: os.getenv("JWT_SECRET") or secrets.token_urlsafe(48))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:3000"
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    SUPABASE_STORAGE_BUCKET: str = "study-documents"

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_postgres_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql://", 1)
        return value

    @field_validator("JWT_SECRET", mode="before")
    @classmethod
    def generate_missing_jwt_secret(cls, value: str | None) -> str:
        if not value or not value.strip():
            return secrets.token_urlsafe(48)
        if value in {
            "supersecretkey_please_change_in_production",
            "replace-with-a-long-random-secret",
        }:
            raise ValueError("Replace the example JWT_SECRET with a private random value")
        return value

    @field_validator("JWT_SECRET")
    @classmethod
    def require_long_jwt_secret(cls, value: str) -> str:
        if len(value.encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET must be at least 32 bytes")
        return value

settings = Settings()
