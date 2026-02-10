from datetime import datetime
from pydantic import BaseModel
from typing import Optional


# Base schema (shared)
class SongBase(BaseModel):
    title: str
    artist: str | None = None
    audio_url: str
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


# Response (API output)
class SongResponse(SongBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Upload URL request
class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str  # MIME type, ví dụ: "audio/mpeg"


# Upload URL response
class UploadUrlResponse(BaseModel):
    upload_url: str  # Presigned URL để upload file
    object_key: str  # Key trong S3 để lưu vào audio_url sau khi upload
    public_url: str  # Public URL sau khi upload xong
