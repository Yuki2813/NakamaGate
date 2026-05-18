import os
import jwt
from fastapi import APIRouter, Depends, Query, Path
from sqlmodel import Session
from backend.database import get_db
from backend.models.favorite import Mediatype
from backend.security import get_current_user_id
from backend.services.content_service import get_directory_service, get_genres_service, get_home_service, get_media_details_service, search_media_service
from fastapi_cache.decorator import cache

router = APIRouter(
    prefix="/content",
    tags=["Content"]
)


# Decodifica el JWT del header Authorization para extraer el user_id.
# Lo necesitamos en el key_builder de @cache porque fastapi-cache construye
# la clave ANTES de resolver Depends(get_current_user_id), así que no podemos
# reutilizar esa dependencia aquí. Si no hay token o es inválido devolvemos
# "anon" y dejamos que el endpoint protegido rechace la petición después.
def _user_id_from_request(request) -> str:
    if request is None:
        return "anon"
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return "anon"
    try:
        payload = jwt.decode(
            auth[7:],
            os.getenv("SECRET_KEY"),
            algorithms=[os.getenv("ALGORITHM", "HS256")]
        )
        return str(payload.get("user_id", "anon"))
    except Exception:
        return "anon"


# Clave de caché por usuario: el home depende de isAdult y por eso no puede
# compartirse entre usuarios. Formato "home:user:{id}" para que las funciones
# invalidate_home_cache puedan purgarla con la misma clave exacta.
def home_key_builder(func, namespace="", *, request=None, response=None, args=(), kwargs={}):
    user_id = kwargs.get("user_id")
    if user_id is None:
        user_id = _user_id_from_request(request)
    return f"home:user:{user_id}"


@router.get("/home")
@cache(expire=3600, key_builder=home_key_builder)
async def get_home(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_home_service(user_id=user_id, session=session)


@router.get("/genres")
async def get_genres(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_genres_service(user_id=user_id, session=session)


@router.get("/directory")
async def get_directory(
    media_type: Mediatype = Query(..., description="'ANIME' o 'MANGA'"),
    page: int = Query(default=1, ge=1, description="Número de página (mínimo 1)"),
    genre: str = Query(default=None, description="Filtrar por un género específico"),
    status: str = Query(default=None, description="Filtrar por estado (RELEASING, FINISHED, NOT_YET_RELEASED)"),
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_directory_service(
        user_id=user_id,
        page=page,
        media_type=media_type,
        session=session,
        genre=genre,
        status=status
    )


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


@router.get("/{media_id}")
async def get_media_details(
    media_id: int = Path(..., description="MAL ID del anime/manga"),
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await get_media_details_service(
        media_id=media_id,
        user_id=user_id,
        session=session
    )
