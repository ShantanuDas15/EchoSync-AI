from fastapi import APIRouter
from app.api.v1.endpoints import clone, tts, auth, health

api_router = APIRouter()

api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(auth.router, prefix="", tags=["auth"])
api_router.include_router(clone.router, prefix="", tags=["voice-cloning"])
api_router.include_router(tts.router, prefix="", tags=["text-to-speech"])
