from datetime import datetime
from pydantic import BaseModel


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
    title: str | None = None
    artist: str | None = None
    audio_url: str | None = None
    is_public: bool | None = None


# Response (API output)
class SongResponse(SongBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
