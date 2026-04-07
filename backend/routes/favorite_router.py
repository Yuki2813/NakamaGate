from fastapi import APIRouter


router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)