from fastapi import APIRouter, Query
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session
from backend.database import get_db
from backend.models.favorite import Mediatype
from backend.security import get_current_user_id
from backend.services.content_service import check_if_favorite
from backend.services.interacction_service import add_media_to_list, get_favorite_list, remove_media_from_list

router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)


router = APIRouter(prefix="/favorites", tags=["Favorites"])

class FavoriteAdd(BaseModel):
    media_id: int = Field(..., example=1, description="ID del anime o manga de AniList")
    media_type: Mediatype = Field(..., example="ANIME", description="Tipo de contenido")

# ==========================================
# 1. AÑADIR A FAVORITOS
# ==========================================
@router.post("/", summary="Añadir un anime/manga a favoritos")
async def add_favorite(
    favorite_data: FavoriteAdd,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    result = add_media_to_list(user_id, id_api=favorite_data.media_id,media_type=favorite_data.media_type, session=session)
    return result

# ==========================================
# 2. ELIMINAR DE FAVORITOS
# ==========================================
@router.delete("/{media_id}", summary="Quitar un anime/manga de favoritos")
async def remove_favorite(
    media_id: int,
    media_type:Mediatype=Query(...,description="Tipo de contenido a buscar"),
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):

    result = remove_media_from_list(id_api=media_id, user_id=user_id, session=session,media_type=media_type)
    return result

# ==========================================
# 3. VER TODOS MIS FAVORITOS
# ==========================================
@router.get("/", summary="Obtener lista de favoritos del usuario")
async def get_my_favorites(
    # Opcional: Podemos añadir un filtro para pedir solo "ANIME" o "MANGA"
    # type_filter: str = None, 
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
   
    result= await get_favorite_list(user_id=user_id,session=session)
    return result

# ==========================================
# 4. COMPROBAR SI ES FAVORITO (Para la UI del Frontend)
# ==========================================
@router.get("/check/{media_id}", summary="Comprobar si un ID específico es favorito")
async def check_favorite(
    media_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    check=check_if_favorite(id_api=media_id,user_id=user_id,session=session)
    return check