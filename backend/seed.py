from sqlmodel import Session, text, select, SQLModel
from database import engine
from models.users import Users, Rol
from models.favorite import Favorite, Mediatype
from models.userfavorite import UserFavorite, status_favorite
from models.friendship import Friendship, FriendshipStatus
from models.review import Review, MediaType
import bcrypt
from datetime import datetime, timezone

def hash_password(password: str) -> str:
    """Hashea la contraseña usando bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def seed():
    with Session(engine) as session:
        print("--- 🛠️ Iniciando limpieza de base de datos ---")
        
        # 1. Desactivar restricciones de clave foránea en MySQL
        session.exec(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # 2. Lista de tablas a vaciar (ajusta los nombres si SQLModel usa otros)
        tablas_a_limpiar = [
            "userfavorite", 
            "friendship", 
            "review", 
            "favorite", 
            "users"
        ]
        
        for tabla in tablas_a_limpiar:
            try:
                session.exec(text(f"TRUNCATE TABLE {tabla};"))
                print(f"  🗑️ Tabla '{tabla}' vaciada y IDs reiniciados.")
            except Exception as e:
                print(f"  ⚠️ No se pudo limpiar '{tabla}': {e}")
        
        # 3. Reactivar restricciones
        session.exec(text("SET FOREIGN_KEY_CHECKS = 1;"))
        session.commit()
        
        print("\n--- 🚀 Insertando nuevos datos de prueba ---")

        # ─── USUARIOS ───────────────────────────────────────
        user1 = Users(
            alias="yago",
            email="yago@gmail.com",
            password=hash_password("1234abcd"),
            rol=Rol.admin,
            isAdult=True
        )
        user2 = Users(
            alias="sara",
            email="sara@gmail.com",
            password=hash_password("1234abcd"),
            rol=Rol.user,
            isAdult=True
        )
        user3 = Users(
            alias="carlos",
            email="carlos@gmail.com",
            password=hash_password("1234abcd"),
            rol=Rol.user,
            isAdult=False
        )
        
        session.add_all([user1, user2, user3])
        session.commit()
        
        # Refrescamos para obtener los IDs generados por la DB
        session.refresh(user1)
        session.refresh(user2)
        session.refresh(user3)
        print("✅ Usuarios creados")

        # ─── FAVORITOS ──────────────────────────────────────
        fav1 = Favorite(id_api=1, media_type=Mediatype.anime)   # Attack on Titan
        fav2 = Favorite(id_api=2, media_type=Mediatype.manga)   # Berserk
        fav3 = Favorite(id_api=3, media_type=Mediatype.anime)   # Naruto
        
        session.add_all([fav1, fav2, fav3])
        session.commit()
        
        session.refresh(fav1)
        session.refresh(fav2)
        session.refresh(fav3)
        print("✅ Favoritos creados")

        # ─── USERFAVORITE ────────────────────────────────────
        uf1 = UserFavorite(user_id=user1.id, favorite_id=fav1.id, status=status_favorite.completed)
        uf2 = UserFavorite(user_id=user1.id, favorite_id=fav2.id, status=status_favorite.watching)
        uf3 = UserFavorite(user_id=user2.id, favorite_id=fav1.id, status=status_favorite.pending)
        uf4 = UserFavorite(user_id=user3.id, favorite_id=fav3.id, status=status_favorite.watching)
        
        session.add_all([uf1, uf2, uf3, uf4])
        session.commit()
        print("✅ UserFavorites creados")

        # ─── AMISTADES ──────────────────────────────────────
        fs1 = Friendship(
            requester_id=user1.id,
            receiver_id=user2.id,
            status=FriendshipStatus.friends
        )
        fs2 = Friendship(
            requester_id=user1.id,
            receiver_id=user3.id,
            status=FriendshipStatus.pending
        )
        fs3 = Friendship(
            requester_id=user2.id,
            receiver_id=user1.id,
            status=FriendshipStatus.friends
        )

        session.add_all([fs1, fs2, fs3])
        session.commit()
        print("✅ Amistades creadas")

        # ─── REVIEWS ────────────────────────────────────────
        r1 = Review(
            id_user=user1.id,
            id_api=1,
            media_type=MediaType.anime,
            score=5,
            content="Una obra maestra, imprescindible.",
        )
        r2 = Review(
            id_user=user2.id,
            id_api=1,
            media_type=MediaType.anime,
            score=4,
            content="Muy buena, aunque el final me dejó frío.",
        )
        r3 = Review(
            id_user=user3.id,
            id_api=2,
            media_type=MediaType.manga,
            score=5,
            content="El mejor manga que he leído en mi vida.",
        )
        
        session.add_all([r1, r2, r3])
        session.commit()
        print("✅ Reviews creadas")

        print("\n🎉 Seed completado correctamente. ¡Base de datos reseteada y lista!")

if __name__ == "__main__":
    # 1. ESTO CREA LAS TABLAS SI NO EXISTEN
    print("🏗️ Creando la estructura de las tablas en la base de datos...")
    SQLModel.metadata.create_all(engine)
    
    # 2. ESTO EJECUTA TU FUNCIÓN PARA LLENARLAS
    seed()