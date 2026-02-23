from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Optional


# Base schema (shared)
class SongBase(BaseModel):
    title: str
    artist: str | None = None
    audio_url: str = ""
    is_public: bool = True


# Create (POST /songs)
class SongCreate(SongBase):
    pass


# Update (PATCH /songs/{id})
class SongUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    audio_url: Optional[str] = None
    is_public: Optional[bool] = None


# Response (API output) — id, title, file_url, s3_key, created_at (+ owner_id, artist, audio_url, is_public)
class SongResponse(SongBase):
    id: int
    owner_id: int
    title: str | None = None  # override: DB allows null
    s3_key: str | None = None
    file_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# Confirm upload (POST /songs/confirm-upload) — save metadata after S3 upload
class ConfirmUploadRequest(BaseModel):
    key: str
    title: str | None = None

    @field_validator("key")
    @classmethod
    def key_must_be_songs_mp3(cls, v: str) -> str:
        if not v or not v.startswith("songs/"):
            raise ValueError("key must start with 'songs/'")
        if not v.endswith(".mp3"):
            raise ValueError("only .mp3 files are allowed")
        return v

    @field_validator("title")
    @classmethod
    def title_max_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 255:
            raise ValueError("title max length is 255")
        return v


# Allowed content type for upload (production: only audio/mpeg)
ALLOWED_UPLOAD_CONTENT_TYPE = "audio/mpeg"


# Upload URL request
class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str  # Must be "audio/mpeg"


# Upload URL response (file_url/key for new clients; object_key/public_url for backward compat)
class UploadUrlResponse(BaseModel):
    upload_url: str
    file_url: str
    key: str
    object_key: str  # same as key
    public_url: str   # same as file_url
