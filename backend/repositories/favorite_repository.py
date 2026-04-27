from sqlmodel import Session, select
from backend.models.favorite import Favorite, Mediatype
from backend.models.userfavorite import UserFavorite, status_favorite
from sqlalchemy.orm import joinedload


def new_favorite(iduser: int, id_fav: int, mediatype: Mediatype, session: Session):
    statement = select(Favorite).where(Favorite.id_api == id_fav, Favorite.media_type == mediatype)
    existing_favorite = session.exec(statement=statement).first()

    if not existing_favorite:
        new_favorite_entry = Favorite(id_api=id_fav, media_type=mediatype)
        session.add(new_favorite_entry)
        session.commit()
        session.refresh(new_favorite_entry)

        new_user_favorite = UserFavorite(favorite_id=new_favorite_entry.id, user_id=iduser)
        session.add(new_user_favorite)
        session.commit()
        return True
    else:
        existing_link = session.get(UserFavorite, {"user_id": iduser, "favorite_id": existing_favorite.id})
        if existing_link:
            return False

        new_user_favorite = UserFavorite(favorite_id=existing_favorite.id, user_id=iduser)
        session.add(new_user_favorite)
        session.commit()
        return True


def update_status_favorite(iduser: int, idapi: int, status: status_favorite, session: Session):
    statement = select(Favorite).where(Favorite.id_api == idapi)
    favorites_with_that_id = session.exec(statement).all()

    for favorite in favorites_with_that_id:
        user_link = session.get(UserFavorite, {"user_id": iduser, "favorite_id": favorite.id})

        if user_link:
            user_link.status = status
            session.add(user_link)
            session.commit()
            session.refresh(user_link)
            return True

    return None


def delete_user_favorite(id_user: int, media: Mediatype, idapi: int, session: Session):
    statement = select(Favorite).where(Favorite.id_api == idapi, Favorite.media_type == media)
    favorite = session.exec(statement).first()

    if not favorite:
        return False

    user_link = session.get(UserFavorite, {"user_id": id_user, "favorite_id": favorite.id})
    if not user_link:
        return False

    session.delete(user_link)
    session.commit()
    return True


def get_user_favorites(id_user: int, session: Session):
    statement = (
        select(UserFavorite, Favorite)
        .join(Favorite, UserFavorite.favorite_id == Favorite.id)
        .where(UserFavorite.user_id == id_user)
    )

    favorites = session.exec(statement).all()
    print(favorites)
    return favorites
