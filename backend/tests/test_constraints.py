from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError
from database import engine
from models.users import Users
from models.review import Review, MediaType
from models.friendship import Friendship, FriendshipStatus
from models.favorite import Favorite, Mediatype
from models.userfavorite import UserFavorite

def test_unique_favorite():
    print("\n🧪 Test 1 — Favorito duplicado:")
    with Session(engine) as session:
        try:
            fav_duplicado = Favorite(id_api=1, media_type=Mediatype.anime)
            session.add(fav_duplicado)
            session.commit()
            print("   ❌ ERROR — dejó insertar un favorito duplicado")
        except IntegrityError:
            session.rollback()
            print("   ✅ Correcto — no permite favoritos duplicados")

def test_cascade_delete():
    print("\n🧪 Test 2 — Cascade delete:")
    with Session(engine) as session:
        try:
            user = session.exec(select(Users).where(Users.alias == "carlos")).first()
            user_id = user.id
            session.delete(user)
            session.commit()

            reviews = session.exec(select(Review).where(Review.id_user == user_id)).all()
            favoritos = session.exec(select(UserFavorite).where(UserFavorite.user_id == user_id)).all()
            amistades_enviadas = session.exec(select(Friendship).where(Friendship.requester_id == user_id)).all()
            amistades_recibidas = session.exec(select(Friendship).where(Friendship.receiver_id == user_id)).all()

            if not reviews and not favoritos and not amistades_enviadas and not amistades_recibidas:
                print("   ✅ Correcto — se borraron todos los datos de carlos")
            else:
                print("   ❌ ERROR — quedaron datos huérfanos")
        except Exception as e:
            session.rollback()
            print(f"   ❌ Excepción — {e}")

def test_score_validation():
    print("\n🧪 Test 3 — Score fuera de rango:")
    try:
        review_invalida = Review(
            id_user=1,
            id_api=1,
            media_type=MediaType.anime,
            score=10,  # ← fuera de rango
            content="Test"
        )
        print("   ❌ ERROR — aceptó un score de 10")
    except ValidationError:
        print("   ✅ Correcto — no permite score fuera de 1-5")

def test_duplicate_friendship():
    print("\n🧪 Test 4 — Amistad duplicada:")
    with Session(engine) as session:
        try:
            user1 = session.exec(select(Users).where(Users.alias == "yago")).first()
            user2 = session.exec(select(Users).where(Users.alias == "sara")).first()

            fs_duplicada = Friendship(
                requester_id=user1.id,
                receiver_id=user2.id,
                status=FriendshipStatus.pending
            )
            session.add(fs_duplicada)
            session.commit()
            print("   ❌ ERROR — dejó insertar una amistad duplicada")
        except IntegrityError:
            session.rollback()
            print("   ✅ Correcto — no permite amistades duplicadas")

if __name__ == "__main__":
    test_unique_favorite()
    test_cascade_delete()
    test_score_validation()
    test_duplicate_friendship()
    print("\n🎉 Tests completados")