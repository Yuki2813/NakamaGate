from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlmodel import Session

from backend.database import get_db
from backend.models.review import MediaType
from backend.security import get_current_user_id
from backend.services.interacction_service import create_review_service, delete_review_service, get_review_count_service, get_reviews_by_media_service, get_user_reviews_service, update_review_service


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)
# ==========================================
# 1. CREAR UNA RESEÑA
# ==========================================
class ReviewBase(BaseModel):
    score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Score from 1 to 5"
    )
    content: str = Field(
        ..., 
        min_length=1, 
        max_length=255, 
        description="Contenido de la reseña (máximo 255 caracteres)"
    )

class ReviewUpdate(ReviewBase):
    id_api: int = Field(..., description="ID del anime/manga en AniList")
    media_type: MediaType = Field(..., description="ANIME o MANGA")


class ReviewCreate(ReviewBase):
    id_api: int = Field(..., description="ID del anime/manga en AniList")
    media_type: MediaType = Field(..., description="ANIME o MANGA")

@router.post("/", status_code=201)
async def create_review(
    review_data: ReviewCreate, 
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await create_review_service(
        user_id=user_id,
        id_api=review_data.id_api,
        media_type=review_data.media_type,
        score=review_data.score,
        content=review_data.content,
        session=session
    )

# ==========================================
# 2. ACTUALIZAR UNA RESEÑA
# ==========================================
@router.put("/{review_id}")
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return update_review_service(
        review_id=review_id,
        user_id=user_id,
        score=review_data.score,
        content=review_data.content,
        session=session
    )

# ==========================================
# 3. ELIMINAR UNA RESEÑA
# ==========================================
@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return delete_review_service(
        review_id=review_id,
        user_id=user_id,
        session=session
    )

# ==========================================
# 4. OBTENER RESEÑAS DE UN ANIME/MANGA ESPECÍFICO
# ==========================================
@router.get("/me/count", summary="Número de reseñas del usuario actual")
async def get_my_review_count(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return get_review_count_service(user_id=user_id, session=session)


@router.get("/user/{user_id}", summary="Reseñas públicas de un usuario")
async def get_user_reviews(
    user_id: int,
    current_user: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_user_reviews_service(user_id=user_id, session=session)


@router.get("/media/{media_id}", summary="Obtener todas las reseñas de un anime o manga")
async def get_media_reviews(
    media_id: int,
    media_type: MediaType = Query(..., description="ANIME o MANGA"),
    session: Session = Depends(get_db)
):

    reviews = get_reviews_by_media_service(
        id_api=media_id, 
        media_type=media_type, 
        session=session
    )
    
    return reviews