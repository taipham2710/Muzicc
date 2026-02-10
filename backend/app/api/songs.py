import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.schemas.song import (
    SongCreate,
    SongResponse,
    SongUpdate,
    UploadUrlRequest,
    UploadUrlResponse,
)
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.song import Song
from app.models.user import User
from app.api.schemas.common import PaginatedResponse
from app.services.s3 import generate_presigned_upload_url, get_public_url

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
    q: str | None = None,
):
    query = db.query(Song).filter(
        Song.owner_id == current_user.id,
        Song.is_deleted.is_(False),
    )

    if q:
        query = query.filter(
            or_(Song.title.ilike(f"%{q}%"), Song.artist.ilike(f"%{q}%"))
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

# Auth – lấy presigned URL để upload audio
@router.post(
    "/upload-url",
    response_model=UploadUrlResponse,
    status_code=status.HTTP_200_OK,
)
def get_upload_url(
    payload: UploadUrlRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Tạo presigned URL để upload file audio lên S3/MinIO.

    Validate:
    - File type phải là audio (audio/*)
    - Filename hợp lệ
    """
    # Validate content type
    if not payload.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file",
        )

    # Validate filename
    if not payload.filename or len(payload.filename) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename",
        )

    # Tạo object key: songs/{user_id}/{uuid}.{ext}
    file_ext = payload.filename.split(".")[-1] if "." in payload.filename else "mp3"
    object_key = f"songs/{current_user.id}/{uuid.uuid4()}.{file_ext}"

    try:
        upload_url = generate_presigned_upload_url(
            object_key=object_key,
            content_type=payload.content_type,
            expires_in=3600,  # 1 hour
        )
        public_url = get_public_url(object_key)

        return UploadUrlResponse(
            upload_url=upload_url,
            object_key=object_key,
            public_url=public_url,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
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
