from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "EchoSync AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    SECRET_KEY: str = "change-this-to-a-secure-64-character-random-hex-string"
    API_KEY_NAME: str = "X-API-Key"
    REQUIRE_API_KEY: bool = False
    
    REDIS_URL: str = "redis://localhost:6379/0"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    MAX_UPLOAD_SIZE_MB: int = 10
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
