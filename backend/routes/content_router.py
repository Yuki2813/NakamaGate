from fastapi import APIRouter, Depends, Query, Path
from sqlmodel import Session
from backend.database import get_db
from backend.models.favorite import Mediatype
from backend.security import get_current_user_id
from backend.services.content_service import get_directory_service, get_home_service, get_media_details_service, search_media_service
from fastapi_cache.decorator import cache

router = APIRouter(
    prefix="/content",
    tags=["Content"]
)

# ==========================================
# 1. PÁGINA PRINCIPAL (HOME)
# ==========================================
@router.get("/home")
@cache(expire=3600)
async def get_home(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):

    return await get_home_service(user_id=user_id, session=session)


# ==========================================
# 2. DIRECTORIO (EXPLORAR)
# ==========================================
@router.get("/directory")
@cache(expire=3600)
async def get_directory(
    media_type: Mediatype = Query(..., description="'ANIME' o 'MANGA'"),

    page: int = Query(default=1, ge=1, description="Número de página (mínimo 1)"),

    genre: str = Query(default=None, description="Filtrar por un género específico"),

    user_id: int = Depends(get_current_user_id),

    session: Session = Depends(get_db)
):

    return await get_directory_service(
        user_id=user_id, 
        page=page, 
        media_type=media_type, 
        session=session, 
        genre=genre
    )


# ==========================================
# 3. BUSCADOR PREDICTIVO
# ==========================================
@router.get("/search")
async def search_media(

    search_text: str = Query(..., min_length=3, description="Texto a buscar"),
    media_type: Mediatype = Query(..., description="Tipo de contenido a buscar"),
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):

    return await search_media_service(
        user_id=user_id, 
        search_text=search_text, 
        media_type=media_type, 
        session=session
    )


# ==========================================
# 4. DETALLES DEL ANIME/MANGA
# ==========================================

@router.get("/{media_id}")

async def get_media_details(
    media_id: int = Path(..., description="ID del anime/manga en AniList"),
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):

    return await get_media_details_service(
        media_id=media_id, 
        user_id=user_id, 
        session=session
    )