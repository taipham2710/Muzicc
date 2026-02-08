from app.db.session import engine
from app.db.base import Base

# Import models để SQLAlchemy biết
from app.models.user import User
from app.models.song import Song


def init_db():
    Base.metadata.create_all(bind=engine)
