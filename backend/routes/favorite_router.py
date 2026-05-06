from fastapi import APIRouter, Query
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session
from backend.database import get_db
from backend.models.favorite import Mediatype
from backend.models.userfavorite import status_favorite
from backend.security import get_current_user_id
from backend.services.content_service import check_if_favorite
from backend.services.interacction_service import add_media_to_list, get_favorite_ids_service, get_favorite_list_paginated, get_watching_favorites_service, remove_media_from_list, update_media_status

router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)

class FavoriteAdd(BaseModel):
    media_id: int = Field(..., example=1, description="ID del anime o manga de AniList")
    media_type: Mediatype = Field(..., example="ANIME", description="Tipo de contenido")
class StatusUpdate(BaseModel):
    status: status_favorite
# ==========================================
# 1. AÑADIR A FAVORITOS
# ==========================================
@router.post("/", summary="Añadir un anime/manga a favoritos")
async def add_favorite(
    favorite_data: FavoriteAdd,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):

    result = await add_media_to_list(user_id, id_api=favorite_data.media_id,media_type=favorite_data.media_type, session=session)
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
# 3. VER MIS FAVORITOS (paginado)
# ==========================================
@router.get("/", summary="Obtener lista de favoritos del usuario (paginada)")
async def get_my_favorites(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_favorite_list_paginated(user_id=user_id, session=session, page=page, limit=limit)

# ==========================================
# 4. IDs DE FAVORITOS (ligero, sin llamada a AniList)
# ==========================================
@router.get("/ids", summary="Obtener todos los IDs de favoritos del usuario")
def get_favorite_ids(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return get_favorite_ids_service(user_id=user_id, session=session)


# ==========================================
# 5. FAVORITOS EN ESTADO "WATCHING" CON DATOS COMPLETOS
# ==========================================
@router.get("/watching", summary="Obtener favoritos con estado Watching")
async def get_watching_favorites(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_watching_favorites_service(user_id=user_id, session=session)


# ==========================================
# 6. COMPROBAR SI ES FAVORITO (Para la UI del Frontend)
# ==========================================
@router.get("/check/{media_id}", summary="Comprobar si un ID específico es favorito")
async def check_favorite(
    media_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    check=check_if_favorite(id_api=media_id,user_id=user_id,session=session)
    return check

# ==========================================
# 5. ACTUALIZAR ESTADO DEL FAVORITO
# ==========================================
@router.put("/{media_id}/status", summary="Cambiar el estado de un favorito (Viendo, Completado...)")
async def update_favorite_status_endpoint(
    media_id: int,
    status_data: StatusUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    # Llamamos a tu servicio existente
    result = update_media_status(
        user_id=user_id, 
        favorite_id=media_id, 
        new_status=status_data.status, 
        session=session
    )
    return result