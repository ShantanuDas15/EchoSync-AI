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

    # Hugging Face Spaces Config
    HF_SPACE_URL: str = "https://your-space.hf.space"
    HF_API_TOKEN: str = ""
    
    # Cloudflare R2 Storage Config
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "echosync-artifacts"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
