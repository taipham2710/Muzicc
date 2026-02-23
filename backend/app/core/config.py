from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AWS S3 settings (IRSA in production – do NOT use static credentials)
    AWS_ACCESS_KEY_ID: str = ""  # Deprecated: kept only for local/dev overrides
    AWS_SECRET_ACCESS_KEY: str = ""  # Deprecated: kept only for local/dev overrides
    S3_BUCKET: str = ""
    S3_REGION: str = "ap-southeast-1"
    S3_PUBLIC: bool = False  # True = direct URL; False = presigned GET (private bucket)

    class Config:
        env_file = ".env"

settings = Settings()
