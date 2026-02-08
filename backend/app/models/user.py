from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    # id = Column(Integer, primary_key=True, index=True)
    # email = Column(String, unique=True, index=True, nullable=False)
    # password_hash = Column(String, nullable=False)
    # created_at = Column(DateTime(timezone=True), server_default=func.now())

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    songs = relationship(
        "Song",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
