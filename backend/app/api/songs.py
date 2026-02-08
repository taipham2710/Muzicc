from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas.song import SongCreate, SongResponse
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.song import Song
from app.models.user import User

router = APIRouter()


# Public – ai cũng xem được
@router.get("", response_model=list[SongResponse])
def list_public_songs(db: Session = Depends(get_db)):
    return (
        db.query(Song)
        .filter(Song.is_public.is_(True))
        .order_by(Song.created_at.desc())
        .all()
    )


# Auth – bài của tôi
@router.get("/me", response_model=list[SongResponse])
def list_my_songs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Song)
        .filter(Song.owner_id == current_user.id)
        .order_by(Song.created_at.desc())
        .all()
    )


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


# Auth + ownership
@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(
    song_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    song = db.query(Song).filter(Song.id == song_id).first()

    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    if song.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(song)
    db.commit()
