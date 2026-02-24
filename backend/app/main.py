from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, songs, health
from app.db.init_db import init_db


app = FastAPI(title="MUZICC Backend API")


@app.on_event("startup")
def on_startup() -> None:
    """
    Ensure DB schema exists when the app starts.
    Safe to run multiple times; create_all() is idempotent.
    """
    init_db()


app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(songs.router, prefix="/songs", tags=["songs"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
