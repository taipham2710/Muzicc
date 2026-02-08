from fastapi import FastAPI
from app.api import auth, songs, health
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MUZICC Backend API")

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(songs.router, prefix="/songs", tags=["songs"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
