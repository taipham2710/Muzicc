from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas.song import SongCreate, SongResponse, SongUpdate
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.song import Song
from app.models.user import User
from app.api.schemas.common import PaginatedResponse

router = APIRouter()


# Public – ai cũng xem được
@router.get(
    "",
    response_model=PaginatedResponse[SongResponse],
)
def list_public_songs(
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
    q: str | None = None,
    artist: str | None = None,
):
    query = db.query(Song).filter(
        Song.is_public.is_(True),
        Song.is_deleted.is_(False),
    )

    # SEARCH TITLE
    if q:
        query = query.filter(Song.title.ilike(f"%{q}%"))

    # FILTER ARTIST
    if artist:
        query = query.filter(Song.artist.ilike(f"%{artist}%"))

    total = query.count()

    songs = (
        query
        .order_by(Song.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return {
        "items": songs,
        "total": total,
        "limit": limit,
        "offset": offset,
    }

# Auth – bài của tôi
@router.get(
    "/me",
    response_model=PaginatedResponse[SongResponse],
    operation_id="list_my_songs",
)
def list_my_songs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
):
    query = db.query(Song).filter(
        Song.owner_id == current_user.id,
        Song.is_deleted.is_(False),
    )

    total = query.count()

    songs = (
        query
        .order_by(Song.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return {
        "items": songs,
        "total": total,
        "limit": limit,
        "offset": offset,
    }

# Auth – tạo bài
@router.post(
    "",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_song(
    payload: SongCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    song = Song(
        title=payload.title,
        artist=payload.artist,
        audio_url=payload.audio_url,
        is_public=payload.is_public,
        owner_id=current_user.id,
    )

    db.add(song)
    db.commit()
    db.refresh(song)

    return song


@router.put(
    "/{song_id}",
    response_model=SongResponse,
)
def update_song(
    song_id: int,
    payload: SongUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    song = db.query(Song).filter(
        Song.id == song_id,
        Song.is_deleted.is_(False),
    ).first()

    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    if song.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(song, field, value)

    db.commit()
    db.refresh(song)

    return song

# Auth + ownership
@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(
    song_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    song = db.query(Song).filter(
        Song.id == song_id,
        Song.is_deleted.is_(False),
    ).first()

    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    if song.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    song.is_deleted = True
    db.commit()
