import logging
import re
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.schemas.common import PaginatedResponse
from app.api.schemas.song import (
    ALLOWED_UPLOAD_CONTENT_TYPE,
    CheckFileRequest,
    CheckFileResponse,
    ConfirmUploadRequest,
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
from app.services.s3 import (
    build_s3_key,
    generate_presigned_upload_url,
    get_file_url,
    object_exists,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# DB stores only s3_key; never store presigned URL. file_url generated at response time.
def song_to_response(song: Song) -> SongResponse:
    """Build SongResponse with file_url from get_file_url(song.s3_key) at runtime."""
    file_url: str | None = None
    if song.s3_key:
        try:
            file_url = get_file_url(song.s3_key)
        except Exception:
            pass
    # Backward compat: old rows may have audio_url stored (e.g. direct URL)
    if file_url is None and getattr(song, "audio_url", None):
        file_url = song.audio_url or None
    return SongResponse(
        id=song.id,
        owner_id=song.owner_id,
        title=song.title,
        artist=song.artist,
        audio_url=file_url or "",
        is_public=song.is_public,
        s3_key=song.s3_key,
        file_url=file_url,
        created_at=song.created_at,
    )


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
        "items": [song_to_response(s) for s in songs],
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
        "items": [song_to_response(s) for s in songs],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# Public – single song by id (from DB only)
@router.get(
    "/{song_id}",
    response_model=SongResponse,
)
def get_song(
    song_id: int,
    db: Session = Depends(get_db),
):
    song = (
        db.query(Song)
        .filter(Song.id == song_id, Song.is_deleted.is_(False))
        .first()
    )
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if not song.is_public:
        raise HTTPException(status_code=404, detail="Song not found")
    return song_to_response(song)


@router.post(
    "/check-file",
    response_model=CheckFileResponse,
    status_code=status.HTTP_200_OK,
)
def check_file(
    payload: CheckFileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckFileResponse:
    """
    Check if a file with the given SHA256 hash already exists.
    If exists, return its S3 object_key and CloudFront URL so the client can reuse it.
    """
    song = (
        db.query(Song)
        .filter(
            Song.file_hash == payload.file_hash,
            Song.s3_key.isnot(None),
        )
        .order_by(Song.created_at.asc())
        .first()
    )
    if not song:
        return CheckFileResponse(exists=False)

    try:
        file_url = get_file_url(song.s3_key)
    except Exception:
        file_url = None

    logger.info(
        "check-file dedup hit",
        extra={
            "file_hash": payload.file_hash,
            "s3_key": song.s3_key,
            "song_id": song.id,
            "user_id": current_user.id,
        },
    )
    return CheckFileResponse(
        exists=True,
        object_key=song.s3_key,
        file_url=file_url,
    )


# Auth – presigned URL for S3 upload (POST /songs/upload-url)
@router.post(
    "/upload-url",
    response_model=UploadUrlResponse,
    status_code=status.HTTP_200_OK,
)
def get_upload_url(
    payload: UploadUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UploadUrlResponse:
    """
    Generate presigned URL for uploading an audio file to S3.
    Only content_type "audio/mpeg" is allowed.
    If a file with the same SHA256 hash already exists, reuse its S3 object.
    """
    if payload.content_type != ALLOWED_UPLOAD_CONTENT_TYPE:
        logger.warning(
            "Rejected upload-url request: invalid content_type=%s",
            payload.content_type,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only content_type '{ALLOWED_UPLOAD_CONTENT_TYPE}' is allowed",
        )

    if not payload.filename or len(payload.filename) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename",
        )

    # Deduplication: if a file with the same hash already exists, reuse its S3 object.
    existing = (
        db.query(Song)
        .filter(
            Song.file_hash == payload.file_hash,
            Song.s3_key.isnot(None),
        )
        .order_by(Song.created_at.asc())
        .first()
    )
    if existing:
        try:
            file_url = get_file_url(existing.s3_key)
        except Exception:
            file_url = ""
        logger.info(
            "upload-url dedup hit, reusing existing object",
            extra={
                "file_hash": payload.file_hash,
                "s3_key": existing.s3_key,
                "existing_song_id": existing.id,
                "user_id": current_user.id,
            },
        )
        return UploadUrlResponse(
            upload_url=None,
            file_url=file_url,
            key=existing.s3_key,
            object_key=existing.s3_key,
            public_url=file_url,
            already_exists=True,
        )

    object_key = build_s3_key(payload.filename)
    try:
        upload_url = generate_presigned_upload_url(
            object_key=object_key,
            content_type=ALLOWED_UPLOAD_CONTENT_TYPE,
            expires_in=3600,
        )
        file_url = get_file_url(object_key)
        logger.info(
            "Upload URL generated for user_id=%s key=%s",
            current_user.id,
            object_key,
        )
        return UploadUrlResponse(
            upload_url=upload_url,
            file_url=file_url,
            key=object_key,
            object_key=object_key,
            public_url=file_url,
            already_exists=False,
        )
    except ValueError as e:
        logger.exception("Failed to generate presigned upload URL for key=%s", object_key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


# Auth – confirm upload: save metadata to DB after client uploaded file to S3
@router.post(
    "/confirm-upload",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
)
def confirm_upload(
    payload: ConfirmUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SongResponse:
    """
    After client uploads file to S3 using upload-url, call this to save metadata.
    Verifies file exists in S3 (head_object). DB stores only s3_key; URL generated at response time.
    """
    try:
        exists = object_exists(payload.key)
    except RuntimeError as e:
        logger.error(
            "confirm-upload S3 infra error",
            extra={"key": payload.key, "user_id": current_user.id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="S3 check failed",
        ) from e
    if not exists:
        logger.warning(
            "confirm-upload file not found in S3",
            extra={"key": payload.key, "user_id": current_user.id},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File not found in S3. Upload the file first.",
        )
    existing = db.query(Song).filter(Song.s3_key == payload.key).first()
    if existing:
        logger.info(
            "confirm-upload duplicate key, returning existing",
            extra={"key": payload.key, "user_id": current_user.id},
        )
        return song_to_response(existing)
    # Do NOT store presigned URL in DB; only s3_key. file_url generated at response time.
    song = Song(
        title=payload.title or None,
        s3_key=payload.key,
        file_url=None,
        audio_url="",
        is_public=True,
        owner_id=current_user.id,
    )
    db.add(song)
    try:
        db.commit()
        db.refresh(song)
    except Exception as e:
        logger.exception(
            "confirm-upload DB insert failed",
            extra={"key": payload.key, "user_id": current_user.id},
        )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        ) from e
    logger.info(
        "confirm-upload success",
        extra={"key": payload.key, "user_id": current_user.id, "song_id": song.id},
    )
    return song_to_response(song)


# S3 key pattern (songs/{8-hex}.mp3) — must match upload flow
_S3_KEY_RE = re.compile(r"^songs/[0-9a-f]{8}\.mp3$")


def _s3_key_from_audio_url(audio_url: str) -> str | None:
    """Extract s3_key from our S3 public/presigned URL (path before query)."""
    if not audio_url or not audio_url.strip():
        return None
    try:
        parsed = urlparse(audio_url)
        path = (parsed.path or "").strip("/")
        key = unquote(path)
        if _S3_KEY_RE.fullmatch(key):
            return key
    except Exception:
        pass
    return None


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
    # Backend requires s3_key (NOT NULL). Prefer object_key, then parse from audio_url.
    s3_key = None
    if payload.object_key and _S3_KEY_RE.fullmatch(payload.object_key):
        s3_key = payload.object_key
    elif payload.audio_url:
        s3_key = _s3_key_from_audio_url(payload.audio_url)

    # If file_hash is provided, try to reuse existing S3 object (dedup safety net).
    if payload.file_hash:
        existing = (
            db.query(Song)
            .filter(
                Song.file_hash == payload.file_hash,
                Song.s3_key.isnot(None),
            )
            .order_by(Song.created_at.asc())
            .first()
        )
        if existing:
            s3_key = existing.s3_key

    if not s3_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="object_key required when creating song (or audio_url must be a valid S3 URL from upload)",
        )
    song = Song(
        title=payload.title,
        artist=payload.artist,
        s3_key=s3_key,
        file_hash=payload.file_hash,
        audio_url=payload.audio_url or "",
        is_public=payload.is_public,
        owner_id=current_user.id,
    )

    db.add(song)
    db.commit()
    db.refresh(song)

    return song_to_response(song)


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

    return song_to_response(song)

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
