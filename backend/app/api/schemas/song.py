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
