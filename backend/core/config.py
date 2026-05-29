from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Iterm"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_FOR_JWT"  # TODO: change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "iterm_db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
