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
    S3_PUBLIC: bool = False  # True = direct S3 URL; False = presigned GET or CloudFront
    # CloudFront: when set, playback uses CDN URL (no presigned GET, S3 stays private)
    CLOUDFRONT_URL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
