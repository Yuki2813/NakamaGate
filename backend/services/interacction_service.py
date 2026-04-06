from fastapi import HTTPException, status
from sqlmodel import Session

from backend.clients import anilist_client
from backend.models.review import MediaType
from backend.repositories.favorite_repository import delete_user_favorite, get_user_favorites, new_favorite, update_status_favorite
from backend.repositories.review_repository import create_review, delete_review, get_review_by_id, get_user_review_for_media, update_review

# Aquí importarás tus repositorios y el cliente de la API cuando los tengas:
# from backend.repositories.favorite_repository import ...
# from backend.repositories.review_repository import ...
# from backend.services.anilist_client import get_media_batch

# ==========================================
# GESTIÓN DE FAVORITOS / LISTAS (Viendo, Completado, etc.)
# ==========================================

def add_media_to_list(user_id: int, id_api: int, media_type: MediaType, session: Session):

    if(new_favorite(iduser=user_id,id_fav=id_api,mediatype=media_type,session=session)):
        return {"message":"The media its now in your favorites"}
    else:
        raise HTTPException(status_code=400,detail="You already have this media in your favorites")
    # 1. Llamar al repo para comprobar si este usuario ya tiene este id_api en su lista.
    # 2. Si ya lo tiene, lanzar HTTPException 400 ("This media is already in your list").
    # 3. Si no lo tiene, llamar al repo para guardarlo.
    # 4. Devolver un mensaje de éxito.
    

def update_media_status(user_id: int, favorite_id: int, new_status: str, session: Session):
    if(update_status_favorite(iduser=user_id,idfavorite=favorite_id,status=new_status,session=session)):
        return{"message":"The status was updated successfully"}
    else:
        raise HTTPException(status_code=404,detail="The anime/manga could not be found ")
    # 1. Llamar al repo para actualizar el estado (ej: de "watching" a "completed").
    # 2. Si el repo devuelve False (no se encontró el favorito), lanzar HTTPException 404.
    # 3. Si va bien, devolver un mensaje de éxito.

def remove_media_from_list(user_id: int, id_api: int, session: Session):
    if(delete_user_favorite(id_user=user_id,idapi=id_api,session=session)):
        return {"message":"The anime/manga was properly removed"}
    else:
        raise HTTPException(status_code=404,detail="At this time, we are unable to remove the manga/anime you requested")
    # 1. Llamar al repo para borrar el registro usando el user_id y el id_api.
    # 2. Si el repo devuelve False, lanzar HTTPException 404 ("Media not found in your list").
    # 3. Devolver un mensaje de éxito.

async def get_favorite_list(user_id: int, session: Session):
    favorite_list=get_user_favorites(id_user=user_id,session=session)
    if len(favorite_list)==0:
        return []
    
    list_id_favorites=[]

    for favorite in favorite_list:
        list_id_favorites.append(favorite.favorite.id_api)
    
    media_list=await anilist_client.get_media_batch(list_id_favorites)


    media_dict = {}
    for media in media_list:
        # AniList devuelve "ANIME" o "MANGA" en mayúsculas, lo pasamos a minúsculas
        tipo_media = media["type"].lower() 
        
        # Creamos una tupla (ID, tipo) que será nuestra llave indestructible
        llave_compuesta = (media["id"], tipo_media) 
        
        media_dict[llave_compuesta] = media

    lista_final = []

    for favorite in favorite_list:

        llave_busqueda = (favorite.favorite.id_api, favorite.favorite.media_type.value)
        

        info_anime = media_dict.get(llave_busqueda)
        
        if info_anime:
            elemento_mezclado = {
                "status": favorite.status,
                "media": info_anime
            }
            lista_final.append(elemento_mezclado)

    return lista_final

# ==========================================
# GESTIÓN DE RESEÑAS (REVIEWS)
# ==========================================

def create_review_service(user_id: int, id_api: int, media_type: MediaType, score: int, content: str, session: Session):
    if score<0 or score>5:
        raise HTTPException(status_code=400,detail="The score must be between 0 and 5")
    if len(content)<1 or len(content)>255:
        raise HTTPException(status_code=400,detail="The review content must be between 1 and 255 characters.")
    if(get_user_review_for_media(user_id=user_id,id_api=id_api,media_type=media_type,session=session)!=None):
        raise HTTPException(status_code=400,detail="You already reviewed this media, please edit your existing review")
    review=create_review(user_id=user_id,id_api=id_api,media_type=media_type,score=score,content=content,session=session)

    return review

    # 1. Validar la nota: si score < 1 o score > 5 (o 10, según tu escala), lanzar HTTPException 400.
    # 2. Validar texto: si len(content) > 255 (o el límite que le pongas en la BD), lanzar HTTPException 400.
    # 3. Comprobar en el repo si este usuario YA hizo una reseña para este id_api. 
    #    Si es así, lanzar HTTPException 400 ("You already reviewed this media, please edit your existing review").
    # 4. Llamar al repo para crear la review y devolverla.

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
    # 1. Validar la nota y la longitud del texto (igual que en create_review).
    # 2. Llamar al repo para buscar la review por su ID. Si no existe, lanzar HTTPException 404.
    # 3. SEGURIDAD: Comprobar que review.user_id == user_id. Si un usuario intenta editar 
    #    la reseña de otro, lanzar HTTPException 403 ("You can only edit your own reviews").
    # 4. Llamar al repo para guardar los cambios y devolver la review actualizada.


def delete_review_service(review_id: int, user_id: int, session: Session):
    review = get_review_by_id(review_id=review_id, session=session)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.id_user != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    if(delete_review(review_id=review_id,session=session)):
        return {"message":"Review deleted correctly"}
    else:
        raise HTTPException(status_code=400,detail="We were unable to delete your review. Please try again later.")
    # 1. Llamar al repo para buscar la review por su ID. Si no existe, lanzar HTTPException 404.
    # 2. SEGURIDAD: Comprobar que review.user_id == user_id. Si intenta borrar la de otro, lanzar HTTPException 403.
    # 3. Llamar al repo para borrarla y devolver un mensaje de éxito.
