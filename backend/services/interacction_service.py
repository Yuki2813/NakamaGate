from fastapi import HTTPException, status
from sqlmodel import Session

from backend.clients import anilist_client
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

def add_media_to_list(user_id: int, id_api: int, media_type: MediaType, session: Session):

    if(new_favorite(iduser=user_id,id_fav=id_api,mediatype=media_type,session=session)):
        return {"message":"The media its now in your favorites"}
    else:
        raise HTTPException(status_code=400,detail="You already have this media in your favorites")

    

def update_media_status(user_id: int, favorite_id: int, new_status: str, session: Session):
    if(update_status_favorite(iduser=user_id,idfavorite=favorite_id,status=new_status,session=session)):
        return{"message":"The status was updated successfully"}
    else:
        raise HTTPException(status_code=404,detail="The anime/manga could not be found ")


def remove_media_from_list(user_id: int, id_api: int, session: Session):
    if(delete_user_favorite(id_user=user_id,idapi=id_api,session=session)):
        return {"message":"The anime/manga was properly removed"}
    else:
        raise HTTPException(status_code=404,detail="At this time, we are unable to remove the manga/anime you requested")


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

        tipo_media = media["type"].lower() 
        

        llave_compuesta = (media["id"], tipo_media) 
        
        media_dict[llave_compuesta] = media

    lista_final = []

    for favorite in favorite_list:

        key = (favorite.favorite.id_api, favorite.favorite.media_type.value)
        

        info_anime = media_dict.get(key)
        
        if info_anime:
            random_element = {
                "status": favorite.status,
                "media": info_anime
            }
            lista_final.append(random_element)

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