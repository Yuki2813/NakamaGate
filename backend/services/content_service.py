from fastapi import HTTPException, status
from sqlmodel import Session
import random

from backend.clients.anilist_client import anilist_client
from backend.models.favorite import Mediatype
from backend.repositories.favorite_repository import get_user_favorites
from backend.repositories.user_repository import get_user_by_id


# ==========================================
# PÁGINA PRINCIPAL (HOME)
# ==========================================

async def get_home_service(user_id: int, session: Session):

    user=get_user_by_id(id=user_id,session=session)

    if not user:
        raise HTTPException(status_code=404,detail="You are not logged in, or there was an error with your request")
    
    if user.isAdult:

        posibles_generos = [
            "Action", "Adventure", "Comedy", "Drama", "Ecchi", 
            "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music", 
            "Mystery", "Psychological", "Romance", "Sci-Fi", 
            "Slice of Life", "Sports", "Supernatural", "Thriller"
        ]
    else:

        posibles_generos = [
            "Action", "Adventure", "Comedy", "Fantasy", 
            "Mahou Shoujo", "Mecha", "Music", "Mystery", 
            "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural"
        ]

    recomendaciones=random.sample(posibles_generos,3)


    data = await anilist_client.get_home_data(genres=recomendaciones)
    
    for key in ["genre1", "genre2", "genre3"]:
        items = data[key]["items"]
        random.shuffle(items)
        data[key]["items"] = items[:6]
        
    return data


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
    except:
        raise HTTPException(status_code=401,detail="Media not found")

    if not content:
        raise HTTPException(status_code=404, detail="No results match your search")
        
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        

    es_hentai = content.get("is_adult") == True
    

    generos_del_anime = content.get("genres", [])
    

    generos_prohibidos_menores = ["Ecchi", "Horror", "Psychological", "Drama", "Thriller"]
    

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


async def get_directory_service(user_id: int, page: int, media_type: Mediatype, session: Session, genre: str = None):

    if page < 1:
        raise HTTPException(status_code=400, detail="Page number must be 1 or higher")
        

    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        

    if genre: 
        if user.isAdult:
            posibles_generos = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"]
        else:
            posibles_generos = ["Action", "Adventure", "Comedy", "Fantasy", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural"]
            

        if genre not in posibles_generos:
            raise HTTPException(status_code=403, detail="You don't have permission to view this genre or it doesn't exist.")


    directory_data = await anilist_client.get_directory_page(
        page=page, 
        per_page=20, 
        media_type=media_type, 
        sort="POPULARITY_DESC",
        genre=genre 
    )
    return directory_data

def check_if_favorite(user_id: int, id_api: int, session: Session) -> bool:
  
    all_favs = get_user_favorites(id_user=user_id, session=session)
    
    for favorite in all_favs:
        if favorite.favorite.id_api == id_api:
            return True
            
    return False