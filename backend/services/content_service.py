from fastapi import HTTPException
from sqlmodel import Session
import random
from random import Random
from datetime import date

from backend.clients.anilist_client import anilist_client
from backend.models.favorite import Mediatype
from backend.repositories.favorite_repository import get_user_favorites
from backend.repositories.user_repository import get_user_by_id

SAFE_GENRES = [
    "Action", "Adventure", "Comedy", "Fantasy",
    "Mahou Shoujo", "Mecha", "Music", "Mystery",
    "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
    "Drama","Horror", "Psychological", "Thriller"
]

ADULT_GENRES = SAFE_GENRES + [ "Ecchi" ]


# ==========================================
# GÉNEROS DISPONIBLES
# ==========================================

async def get_genres_service(user_id: int, session: Session):
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"genres": sorted(ADULT_GENRES if user.isAdult else SAFE_GENRES)}


# ==========================================
# PÁGINA PRINCIPAL (HOME)
# ==========================================

async def get_home_service(user_id: int, session: Session):

    user = get_user_by_id(id=user_id, session=session)

    if not user:
        raise HTTPException(status_code=404, detail="You are not logged in, or there was an error with your request")

    posibles_generos = ADULT_GENRES if user.isAdult else SAFE_GENRES

    # Reducimos a 4 carruseles aleatorios para encajar con el nuevo cliente
    recomendaciones = random.sample(posibles_generos, 4)

    paginas_random = []
    for _ in range(4):
        paginas_random.append(random.randint(1, 4))

    data = await anilist_client.get_home_data(genres=recomendaciones, pages=paginas_random)
    
    # --- LÓGICA GEMA DEL DÍA ---
    # Instancia local: no toca el random global, safe en concurrencia
    daily_rng = Random(date.today().toordinal())

    pool_anime = data.get("genre1", {}).get("items", [])
    anime_del_dia = daily_rng.choice(pool_anime) if pool_anime else None

    pool_manga = data.get("trending_manga", [])
    manga_del_dia = daily_rng.choice(pool_manga) if pool_manga else None
    
    # --- MEZCLA DE CARRUSELES ---
    for key in ["genre1", "genre2", "genre3", "genre4"]:
        if key in data and "items" in data[key]:
            items = data[key]["items"]
            random.shuffle(items)
            data[key]["items"] = items
            
    # Devolvemos la nueva estructura estructurada
    return {
        "anime_del_dia": anime_del_dia,
        "manga_del_dia": manga_del_dia,
        "trending_anime": data.get("trending_anime", []),
        "trending_manga": data.get("trending_manga", []),
        "upcoming": data.get("upcoming", []),
        "genre1": data.get("genre1", {}),
        "genre2": data.get("genre2", {}),
        "genre3": data.get("genre3", {}),
        "genre4": data.get("genre4", {})
    }


# ==========================================
# BUSCADOR 
# ==========================================

async def search_media_service(user_id: int, search_text: str, media_type: Mediatype, session: Session):

    if len(search_text)<3:
        raise HTTPException(status_code=400, detail="The search must be at least 3 characters long")
    
    user = get_user_by_id(id=user_id, session=session)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    list_media_searched=await anilist_client.search_predictive(search_text=search_text, media_type=media_type)

    if len(list_media_searched)==0:
        raise HTTPException(status_code=404,detail="No results match your search")
    
    return list_media_searched

# ==========================================
# FICHA TÉCNICA (DETALLES DEL ANIME/MANGA)
# ==========================================

async def get_media_details_service(media_id: int, user_id: int, session: Session):
    try:
        content = await anilist_client.get_media_details(media_id=media_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Media not found")

    if not content:
        raise HTTPException(status_code=404, detail="No results match your search")
        
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        

    es_hentai = content.get("is_adult") == True
    

    generos_del_anime = content.get("genres", [])
    

    generos_prohibidos_menores = ["Ecchi"]
    

    tiene_genero_prohibido = False

    for genero in generos_del_anime:

        if genero in generos_prohibidos_menores:

            tiene_genero_prohibido = True

            break
    
    if not user.isAdult:

        if es_hentai or tiene_genero_prohibido:

            raise HTTPException(
                status_code=403, 
                detail="You do not have permission to view this content."
            )

    return content


async def get_directory_service(user_id: int, page: int, media_type: Mediatype, session: Session, genre: str = None, status: str = None):

    if page < 1:
        raise HTTPException(status_code=400, detail="Page number must be 1 or higher")
        
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if genre: 
        # ... (Mantener lógica de validación de géneros que ya tienes)
        pass

    # Llamada limpia: Sin filtros de score y con orden de popularidad
    directory_data = await anilist_client.get_directory_page(
        page=page, 
        per_page=24, 
        media_type=media_type, 
        sort="POPULARITY_DESC", # <--- Los más populares primero
        genre=genre,
        status=status
    )
    return directory_data

def check_if_favorite(user_id: int, id_api: int, session: Session):

    all_favs = get_user_favorites(id_user=user_id, session=session)

    for user_fav, fav in all_favs:
        if fav.id_api == id_api:
            return {"is_favorite": True, "status": user_fav.status.value}

    return {"is_favorite": False, "status": None}