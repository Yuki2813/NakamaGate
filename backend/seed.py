"""
Inicialización idempotente de la base de datos.

Crea (si no existe) un único usuario administrador. Seguro para ejecutarse en cada
arranque del contenedor: NO borra datos existentes, NO duplica el admin si ya existe.

Uso:
    python -m backend.seed
"""
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from backend.database import engine
from backend.models.users import Users, Rol
# Importamos el resto de modelos para que SQLAlchemy registre todas las clases
# y pueda resolver las relaciones (Users.reviews, Users.favorites, etc.) al mapear.
from backend.models.review import Review  # noqa: F401
from backend.models.userfavorite import UserFavorite  # noqa: F401
from backend.models.friendship import Friendship  # noqa: F401
from backend.models.favorite import Favorite  # noqa: F401


ADMIN_EMAIL = "yagopuentetecnologia@gmail.com"
ADMIN_PASSWORD = "Yuki_28_13"
ADMIN_ALIAS = "yago"


def hash_password(password: str) -> str:
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def ensure_admin():
    """Garantiza que el admin existe. Idempotente."""
    with Session(engine) as session:
        existing = session.exec(
            select(Users).where(Users.email == ADMIN_EMAIL)
        ).first()

        if existing:
            # Ya existe: nos aseguramos de que sigue siendo admin
            if existing.rol != Rol.admin:
                existing.rol = Rol.admin
                session.add(existing)
                session.commit()
                print(f"Admin role restaurado para '{existing.alias}'")
            else:
                print(f"Admin '{existing.alias}' ya existe, sin cambios")
            return

        # No existe: lo creamos
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
            print(f"Admin '{ADMIN_ALIAS}' creado correctamente")
        except IntegrityError:
            session.rollback()
            print(
                f"No se pudo crear el admin: el alias '{ADMIN_ALIAS}' "
                "ya está en uso por otro usuario"
            )


if __name__ == "__main__":
    ensure_admin()
