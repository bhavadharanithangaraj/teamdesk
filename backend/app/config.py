from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings from environment variables or backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    db_server: str = "localhost,1433"
    db_name: str = "TeamDesk"
    db_user: str = "teamdesk_app"
    db_password: str = ""
    db_driver: str = "ODBC Driver 18 for SQL Server"
    db_trust_server_certificate: bool = True
    # Generous: the first TLS login can be slow while Docker or the database is busy.
    db_login_timeout_seconds: int = 15

    cors_origins: str = "http://localhost:5175"

    @property
    def connection_string(self) -> str:
        # Braces around values let them contain ';' or '=' safely.
        return (
            f"DRIVER={{{self.db_driver}}};"
            f"SERVER={self.db_server};"
            f"DATABASE={self.db_name};"
            f"UID={self.db_user};"
            f"PWD={{{self.db_password.replace('}', '}}')}}};"
            "Encrypt=yes;"
            f"TrustServerCertificate={'yes' if self.db_trust_server_certificate else 'no'};"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
