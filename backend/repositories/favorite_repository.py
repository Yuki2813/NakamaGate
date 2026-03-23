from fastapi import Depends
from sqlmodel import Session, select

from backend.database import get_db
from backend.models.favorite import Favorite, Mediatype
from backend.models.userfavorite import UserFavorite


def new_favorite(iduser:int,id_fav:int,mediatype:Mediatype,session:Session=Depends(get_db)):
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
    else:
        exist_link = session.get(UserFavorite, {"user_id": iduser, "favorite_id": favorite.id})
        if exist_link:
            return {"message": "Ya está en tus favoritos"}
        
        newuserfavorite=UserFavorite(favorite_id=favorite.id,user_id=iduser)
        session.add(newuserfavorite)
        session.commit()

