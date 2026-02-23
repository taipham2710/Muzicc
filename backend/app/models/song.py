from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    artist: Mapped[str | None] = mapped_column(String, nullable=True)

    # S3: source of truth key; file_url from get_file_url(s3_key)
    s3_key: Mapped[str | None] = mapped_column(
        String(512), unique=True, nullable=True, index=True
    )
    file_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    audio_url: Mapped[str] = mapped_column(String(2048), nullable=False, default="")

    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    owner_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    owner = relationship("User", back_populates="songs")
