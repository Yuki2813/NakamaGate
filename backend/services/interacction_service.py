from fastapi import HTTPException, status
from sqlmodel import Session

from backend.clients.anilist_client import anilist_client
from backend.models.favorite import Mediatype
from backend.models.friendship import FriendshipStatus
from backend.models.review import MediaType
from backend.models.users import Rol
from backend.repositories.favorite_repository import delete_user_favorite, get_user_favorites, new_favorite, update_status_favorite
from backend.repositories.friendship_repository import get_friendship_status
from backend.repositories.review_repository import create_review, delete_review, get_review_by_id, get_reviews_by_media, get_user_review_for_media, update_review
from backend.repositories.user_repository import get_user_by_id


# ==========================================
# GESTIÓN DE FAVORITOS / LISTAS (Viendo, Completado, etc.)
# ==========================================

async def add_media_to_list(user_id: int, id_api: int, media_type: MediaType, session: Session):
    """
    Añade un nuevo favorito verificando primero en AniList que el ID y el tipo coinciden.
    """
    # 1. VALIDACIÓN EXTERNA: Preguntamos a AniList qué es realmente este ID
    info_real = await anilist_client.get_media_details(id_api)
    
    # Si AniList devuelve None, el ID ni siquiera existe en su base de datos
    if not info_real:
        raise HTTPException(
            status_code=404, 
            detail=f"This ID {id_api} don't exist."
        )
        
    # Extraemos el tipo real que nos dice AniList ("ANIME" o "MANGA") y lo pasamos a minúsculas
    tipo_real = info_real["type"].lower()
    
    # Comparamos el tipo real con el que el usuario intenta meter en el Swagger/Frontend
    if tipo_real != media_type.value:
        raise HTTPException(
            status_code=400, 
            detail=f"You are trying save a {tipo_real.upper()} like {media_type.value.upper()}."
        )

    # 2. GUARDADO: Si pasamos las validaciones, procedemos a guardar en la base de datos
    if new_favorite(iduser=user_id, id_fav=id_api, mediatype=media_type, session=session):
        return {"message": "The media is now in your favorites"}
    else:
        raise HTTPException(
            status_code=400, 
            detail="You already have this media in your favorites"
        )

    

def update_media_status(user_id: int, favorite_id: int, new_status: str, session: Session):
    if(update_status_favorite(iduser=user_id,idfavorite=favorite_id,status=new_status,session=session)):
        return{"message":"The status was updated successfully"}
    else:
        raise HTTPException(status_code=404,detail="The anime/manga could not be found ")


def remove_media_from_list(user_id: int, id_api: int,media_type:Mediatype,session: Session):
    if(delete_user_favorite(id_user=user_id,idapi=id_api,session=session,media=media_type)):
        return {"message":"The anime/manga was properly removed"}
    else:
        raise HTTPException(status_code=404,detail="At this time, we are unable to remove the manga/anime you requested")


async def get_favorite_list(user_id: int, session: Session):
    # 1. Traer favoritos (vienen como tuplas)
    favorite_tuples = get_user_favorites(id_user=user_id, session=session)
    
    if len(favorite_tuples) == 0:
        return []
    
    anime_ids = []
    manga_ids = []
    
    # 2. Desempaquetamos la tupla para separar los IDs
    for user_fav, fav_data in favorite_tuples:
        tipo = fav_data.media_type.value
        id_api = fav_data.id_api
        
        if tipo == "anime":
            anime_ids.append(id_api)
        else:
            manga_ids.append(id_api)

    # 3. AQUÍ CREAMOS EL MEDIA DICT haciendo las llamadas a AniList
    media_dict = {}

    if len(anime_ids) > 0:
        anime_results = await anilist_client.get_media_batch(anime_ids, "ANIME")
        for a in anime_results:
            llave = (a["id"], "anime")
            media_dict[llave] = a

    if len(manga_ids) > 0:
        manga_results = await anilist_client.get_media_batch(manga_ids, "MANGA")
        for m in manga_results:
            llave = (m["id"], "manga")
            media_dict[llave] = m

    # 4. Construimos la lista final cruzando los datos
    lista_final = []
    for user_fav, fav_data in favorite_tuples:
        id_api = fav_data.id_api
        tipo_db = fav_data.media_type.value
        
        # Buscamos en el diccionario
        llave_busqueda = (id_api, tipo_db)
        datos_anilist = media_dict.get(llave_busqueda)
        
        if datos_anilist is not None:
            resultado = {
                "status": user_fav.status, 
                "media": datos_anilist     
            }
            lista_final.append(resultado)
            
    return lista_final

# ==========================================
# GESTIÓN DE RESEÑAS (REVIEWS)
# ==========================================

async def create_review_service(user_id: int, id_api: int, media_type: MediaType, score: int, content: str, session: Session):
    
    # 1. Validaciones básicas de formato
    if score < 0 or score > 5:
        raise HTTPException(status_code=400, detail="The score must be between 0 and 5.")
    
    if len(content) < 1 or len(content) > 255:
        raise HTTPException(status_code=400, detail="The review content must be between 1 and 255 characters.")
    
    # 2. Comprobar si el usuario ya tiene una reseña para ese medio
    if get_user_review_for_media(user_id=user_id, id_api=id_api, media_type=media_type, session=session) is not None:
        raise HTTPException(status_code=400, detail="You have already reviewed this media. Please edit your existing review instead.")

    # 3. Validación de integridad de datos con AniList
    info_real = await anilist_client.get_media_details(id_api)
    
    if not info_real:
        raise HTTPException(
            status_code=404, 
            detail=f"The ID {id_api} does not exist in the AniList database."
        )
        
    tipo_real = info_real["type"].lower()
    
    if tipo_real != media_type.value:
        raise HTTPException(
            status_code=400, 
            detail=f"Data mismatch: You cannot review an {tipo_real.upper()} as a {media_type.value.upper()}."
        )

    # 4. Guardado final
    review = create_review(user_id=user_id, id_api=id_api, media_type=media_type, score=score, content=content, session=session)

    return review



def update_review_service(review_id: int, user_id: int, score: int, content: str, session: Session):
    if score<0 or score>5:
        raise HTTPException(status_code=400,detail="The score must be between 0 and 5")
    
    if len(content)<1 or len(content)>255:
        raise HTTPException(status_code=400,detail="The review content must be between 1 and 255 characters.")
    review = get_review_by_id(review_id=review_id, session=session)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review.id_user != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")
        
    updated_review = update_review(review_id=review_id, score=score, content=content, session=session)
    
    return updated_review


def delete_review_service(review_id: int, user_id: int, session: Session):
    review = get_review_by_id(review_id=review_id, session=session)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    user = get_user_by_id(id=user_id, session=session)
    
    is_owner = (review.id_user == user_id)
    is_admin = (user.rol == Rol.admin) 
    
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
        
    if delete_review(review_id=review_id, session=session):
        return {"message": "Review deleted correctly"}
    else:
        raise HTTPException(status_code=400, detail="Unable to delete review")
    
def get_reviews_by_media_service(id_api:int,media_type:MediaType,session:Session):
    results = get_reviews_by_media(id_api=id_api, media_type=media_type, session=session)

    final_reviews = []
    for review, user in results:
        review_data = review.model_dump()
        review_data["user_alias"] = user.alias
        review_data["user_picture"] = user.picture
        
        final_reviews.append(review_data)
    
    return final_reviews