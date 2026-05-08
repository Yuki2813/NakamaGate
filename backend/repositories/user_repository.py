from sqlalchemy import delete, or_
from sqlmodel import Session, select
from backend.models.friendship import Friendship
from backend.models.review import Review
from backend.models.userfavorite import UserFavorite
from backend.models.users import Users


def createUser(email: str, alias: str, password: str, is_adult: bool, session: Session):
    new_user = Users(email=email, alias=alias, password=password, isAdult=is_adult)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

def get_user_by_email(email: str, session: Session):
    statement = select(Users).where(Users.email == email)
    user = session.exec(statement=statement).first()

    if user:
        return user

    return None

def get_user_by_id(id: int, session: Session):
    statement = select(Users).where(Users.id == id)
    user = session.exec(statement=statement).first()

    if user:
        return user

    return None

def get_user_by_alias(alias: str, session: Session):
    statement = select(Users).where(Users.alias == alias)
    user = session.exec(statement=statement).first()
    return user

def delete_user(id: int, session: Session):
    user = session.get(Users, id)

    if not user:
        return None

    # Borrar filas dependientes antes del usuario para que no queden huérfanas
    session.exec(
        delete(Friendship).where(
            or_(Friendship.requester_id == id, Friendship.receiver_id == id)
        )
    )
    session.exec(delete(Review).where(Review.id_user == id))
    session.exec(delete(UserFavorite).where(UserFavorite.user_id == id))

    session.delete(user)
    session.commit()
    return True

def update_user_alias(user_id: int, new_alias: str, session: Session):
    alias_taken_statement = select(Users).where(Users.alias == new_alias)
    existing_user_with_alias = session.exec(alias_taken_statement).first()

    if existing_user_with_alias:
        return False

    user = session.get(Users, user_id)
    user.alias = new_alias
    session.add(user)
    session.commit()
    session.refresh(user)
    return True

def update_user_avatar(user_id: int, ruta: str, session: Session):
    user: Users = session.get(Users, user_id)

    if not user:
        return False

    user.picture = ruta
    session.add(user)
    session.commit()
    session.refresh(user)
    return True

def check_email_exist(email: str, session: Session):
    statement = select(Users).where(Users.email == email)
    user = session.exec(statement=statement).first()

    if user:
        return True
    else:
        return False

def check_alias_exist(alias: str, session: Session):
    statement = select(Users).where(Users.alias == alias)
    user = session.exec(statement=statement).first()

    if user:
        return True
    else:
        return False

def check_id_exist(id: int, session: Session):
    statement = select(Users).where(Users.id == id)
    user = session.exec(statement=statement).first()

    if user:
        return True
    else:
        return False

def update_user_adult(user_id: int, is_adult: bool, session: Session):
    user = session.get(Users, user_id)

    if not user:
        return False

    user.isAdult = is_adult
    session.add(user)
    session.commit()
    session.refresh(user)
    return True


def get_users_by_ids(ids: list[int], session: Session) -> list[Users]:
    if not ids:
        return []
    statement = select(Users).where(Users.id.in_(ids))
    return session.exec(statement).all()


def search_users_repo(alias: str, current_user_id: int, session: Session):
    statement = select(Users).where(
        Users.alias.ilike(f"%{alias}%"),
        Users.id != current_user_id
    ).limit(15)

    return session.exec(statement).all()
