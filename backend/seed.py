"""
Inicialización idempotente de la base de datos.

Crea (si no existe) el admin, tres usuarios de prueba (sara, carlos, mei),
algunas reseñas y unas amistades entre ellos. Seguro para ejecutarse en cada
arranque del contenedor: no borra nada y no duplica registros existentes.

Uso:
    python -m backend.seed
"""
import bcrypt
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from backend.database import engine
from backend.models.users import Users, Rol
from backend.models.review import Review, MediaType
from backend.models.userfavorite import UserFavorite  # noqa: F401
from backend.models.friendship import Friendship, FriendshipStatus
from backend.models.favorite import Favorite  # noqa: F401


ADMIN_EMAIL = "yagopuentetecnologia@gmail.com"
ADMIN_PASSWORD = "Yuki_28_13"
ADMIN_ALIAS = "yago"


# Usuarios extra de prueba. (alias, email, password, isAdult).
EXTRA_USERS = [
    ("sara",   "sara@nakama.test",   "Sara_123!",   True),
    ("carlos", "carlos@nakama.test", "Carlos_123!", True),
    ("mei",    "mei@nakama.test",    "Mei_123!",    False),
]


# Reseñas a sembrar. (alias_autor, id_api_anilist, media_type, score, content).
EXTRA_REVIEWS = [
    ("sara",   21,    MediaType.anime, 5, "One Piece sigue siendo la cumbre del shonen."),
    ("sara",   1535,  MediaType.anime, 4, "Death Note arranca brutal, decae en la segunda mitad."),
    ("carlos", 16498, MediaType.anime, 5, "Attack on Titan: animación y guion top tier."),
    ("carlos", 30002, MediaType.manga, 5, "Berserk es arte puro, lectura obligada."),
    ("mei",    30013, MediaType.manga, 4, "One Punch Man me hace reír cada capítulo."),
]


# Amistades a sembrar. (alias_requester, alias_receiver, status).
EXTRA_FRIENDSHIPS = [
    (ADMIN_ALIAS, "sara",   FriendshipStatus.friends),
    (ADMIN_ALIAS, "carlos", FriendshipStatus.friends),
    ("sara",      "carlos", FriendshipStatus.friends),
    ("mei",       "sara",   FriendshipStatus.pending),
]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def ensure_admin(session: Session) -> Users:
    """Garantiza que el admin existe y tiene rol admin."""
    existing = session.exec(select(Users).where(Users.email == ADMIN_EMAIL)).first()
    if existing:
        if existing.rol != Rol.admin:
            existing.rol = Rol.admin
            session.add(existing)
            session.commit()
            print(f"Admin role restaurado para '{existing.alias}'")
        else:
            print(f"Admin '{existing.alias}' ya existe, sin cambios")
        return existing

    admin = Users(
        alias=ADMIN_ALIAS,
        email=ADMIN_EMAIL,
        password=hash_password(ADMIN_PASSWORD),
        rol=Rol.admin,
        isAdult=True,
    )
    try:
        session.add(admin)
        session.commit()
        session.refresh(admin)
        print(f"Admin '{ADMIN_ALIAS}' creado correctamente")
        return admin
    except IntegrityError:
        session.rollback()
        print(f"No se pudo crear el admin: alias '{ADMIN_ALIAS}' ya en uso")
        return session.exec(select(Users).where(Users.alias == ADMIN_ALIAS)).first()


def ensure_extra_users(session: Session) -> None:
    """Crea los usuarios de prueba que aún no existan."""
    for alias, email, password, is_adult in EXTRA_USERS:
        existing = session.exec(select(Users).where(Users.email == email)).first()
        if existing:
            print(f"Usuario '{alias}' ya existe, sin cambios")
            continue
        user = Users(
            alias=alias,
            email=email,
            password=hash_password(password),
            rol=Rol.user,
            isAdult=is_adult,
        )
        try:
            session.add(user)
            session.commit()
            print(f"Usuario '{alias}' creado")
        except IntegrityError:
            session.rollback()
            print(f"No se pudo crear '{alias}': alias o email duplicado")


def _user_by_alias(session: Session, alias: str) -> Users | None:
    return session.exec(select(Users).where(Users.alias == alias)).first()


def ensure_reviews(session: Session) -> None:
    """Inserta reseñas si el (usuario, id_api, media_type) no existe ya."""
    for author_alias, id_api, media_type, score, content in EXTRA_REVIEWS:
        author = _user_by_alias(session, author_alias)
        if author is None:
            print(f"Reseña omitida: usuario '{author_alias}' no encontrado")
            continue

        already = session.exec(
            select(Review).where(
                Review.id_user == author.id,
                Review.id_api == id_api,
                Review.media_type == media_type,
            )
        ).first()
        if already:
            continue

        review = Review(
            id_user=author.id,
            id_api=id_api,
            media_type=media_type,
            score=score,
            content=content,
        )
        session.add(review)
        session.commit()
        print(f"Reseña creada: {author_alias} -> {media_type.value}:{id_api}")


def ensure_friendships(session: Session) -> None:
    """Inserta amistades evitando duplicados en ambas direcciones."""
    for req_alias, rec_alias, status in EXTRA_FRIENDSHIPS:
        requester = _user_by_alias(session, req_alias)
        receiver = _user_by_alias(session, rec_alias)
        if requester is None or receiver is None:
            print(f"Amistad omitida: falta '{req_alias}' o '{rec_alias}'")
            continue

        already = session.exec(
            select(Friendship).where(
                ((Friendship.requester_id == requester.id) & (Friendship.receiver_id == receiver.id))
                | ((Friendship.requester_id == receiver.id) & (Friendship.receiver_id == requester.id))
            )
        ).first()
        if already:
            continue

        session.add(Friendship(
            requester_id=requester.id,
            receiver_id=receiver.id,
            status=status,
        ))
        session.commit()
        print(f"Amistad creada: {req_alias} <-> {rec_alias} ({status.value})")


def run_seed() -> None:
    with Session(engine) as session:
        ensure_admin(session)


def run_demo_seed() -> None:
    """Solo para desarrollo local. No ejecutar en producción."""
    with Session(engine) as session:
        ensure_admin(session)
        ensure_extra_users(session)
        ensure_reviews(session)
        ensure_friendships(session)


if __name__ == "__main__":
    import sys
    if "--demo" in sys.argv:
        run_demo_seed()
    else:
        run_seed()
