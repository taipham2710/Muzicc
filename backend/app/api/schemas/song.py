from datetime import datetime
import re
from pydantic import BaseModel, field_validator
from typing import Optional


# Base schema (shared)
class SongBase(BaseModel):
    title: str
    artist: str | None = None
    audio_url: str = ""
    is_public: bool = True


# S3 key pattern from upload flow: songs/{8-hex}.mp3
S3_KEY_PATTERN = re.compile(r"^songs/[0-9a-f]{8}\.mp3$")


def _validate_sha256(value: str | None) -> str | None:
    """Basic validation for SHA256 hex string (64 chars)."""
    if value is None or value == "":
        return None
    v = value.strip().lower()
    if not re.fullmatch(r"[0-9a-f]{64}", v):
        raise ValueError("file_hash must be a 64-char lowercase hex SHA256 string")
    return v


# Create (POST /songs)
class SongCreate(SongBase):
    """object_key from getUploadUrl — required when creating after S3 upload (backend needs s3_key)."""
    object_key: str | None = None
    file_hash: str | None = None

    @field_validator("object_key")
    @classmethod
    def object_key_pattern(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not S3_KEY_PATTERN.fullmatch(v):
            raise ValueError("object_key must match pattern 'songs/{8-hex}.mp3'")
        return v

    @field_validator("file_hash")
    @classmethod
    def file_hash_must_be_sha256(cls, v: str | None) -> str | None:
        return _validate_sha256(v)


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
        pattern = r"^songs/[0-9a-f]{8}\\.mp3$"
        if not re.fullmatch(pattern, v):
            raise ValueError("key must match pattern 'songs/{8-hex}.mp3'")
        return v

    @field_validator("title")
    @classmethod
    def title_max_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 255:
            raise ValueError("title max length is 255")
        return v


# Allowed content type for upload (production: only audio/mpeg)
ALLOWED_UPLOAD_CONTENT_TYPE = "audio/mpeg"


class CheckFileRequest(BaseModel):
    file_hash: str

    @field_validator("file_hash")
    @classmethod
    def file_hash_must_be_sha256(cls, v: str) -> str:
        out = _validate_sha256(v)
        assert out is not None
        return out


class CheckFileResponse(BaseModel):
    exists: bool
    object_key: Optional[str] = None
    file_url: Optional[str] = None


# Upload URL request
class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str  # Must be "audio/mpeg"
    file_hash: str

    @field_validator("file_hash")
    @classmethod
    def file_hash_must_be_sha256(cls, v: str) -> str:
        out = _validate_sha256(v)
        assert out is not None
        return out


# Upload URL response (file_url/key for new clients; object_key/public_url for backward compat)
class UploadUrlResponse(BaseModel):
    upload_url: Optional[str] = None
    file_url: str
    key: str
    object_key: str  # same as key
    public_url: str   # same as file_url
    already_exists: bool = False
