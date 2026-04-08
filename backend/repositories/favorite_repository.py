from sqlmodel import Session, select
from backend.models.favorite import Favorite, Mediatype
from backend.models.userfavorite import UserFavorite, status_favorite 
from sqlalchemy.orm import joinedload


def new_favorite(iduser:int,id_fav:int,mediatype:Mediatype,session:Session):
    statement=select(Favorite).where(id_fav==Favorite.id_api,mediatype==Favorite.media_type)

    favorite=session.exec(statement=statement).first()
    if not favorite:
        newFavorite=Favorite(id_api=id_fav,media_type=mediatype)
        session.add(newFavorite)
        session.commit()
        session.refresh(newFavorite)
        
        newuserfavorite=UserFavorite(favorite_id=newFavorite.id,user_id=iduser)
        session.add(newuserfavorite)
        session.commit()
        return True
    else:
        exist_link = session.get(UserFavorite, {"user_id": iduser, "favorite_id": favorite.id})
        if exist_link:
            return False
        
        newuserfavorite=UserFavorite(favorite_id=favorite.id,user_id=iduser)
        session.add(newuserfavorite)
        session.commit()
        
        return True
def update_status_favorite(iduser:int,idfavorite:int,status:status_favorite,session:Session):
    link = session.get(UserFavorite, {"user_id": iduser, "favorite_id": idfavorite})
    
    if link:
        link.status = status
        session.add(link)
        session.commit()
        session.refresh(link)
        return True
    return None

def delete_user_favorite(id_user:int,media:Mediatype,idapi:int,session:Session):
    statement = select(Favorite).where(Favorite.id_api == idapi, Favorite.media_type == media)
    favorite = session.exec(statement).first()

    if favorite:
        link = session.get(UserFavorite, {"user_id": id_user, "favorite_id": favorite.id})
        if link:
            session.delete(link)
            session.commit()
            return True
    return False
def get_user_favorites(id_user: int, session: Session):

    statement = (
        select(UserFavorite, Favorite)
        .join(Favorite, UserFavorite.favorite_id == Favorite.id)
        .where(UserFavorite.user_id == id_user)
    )
    
    favorites = session.exec(statement).all()
    print(favorites)
    return favorites