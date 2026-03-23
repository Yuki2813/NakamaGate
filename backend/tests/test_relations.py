from sqlmodel import Session, select
from database import engine

# Importar TODOS los modelos antes de usarlos
from models.users import Users
from models.review import Review
from models.friendship import Friendship
from models.favorite import Favorite
from models.userfavorite import UserFavorite


def test_relations():
    with Session(engine) as session:

        # Buscar usuario yago
        user = session.exec(select(Users).where(Users.alias == "yago")).first()
        print(f"\n👤 Usuario: {user.alias} ({user.email})")

        # Ver sus favoritos
        print(f"\n⭐ Favoritos de {user.alias}:")
        for uf in user.favorites:
            print(f"   - ID API: {uf.favorite.id_api} | Tipo: {uf.favorite.media_type} | Estado: {uf.status}")

        # Ver sus reviews
        print(f"\n📝 Reviews de {user.alias}:")
        for review in user.reviews:
            print(f"   - ID API: {review.id_api} | Tipo: {review.media_type} | Puntuación: {review.score} | {review.content}")

        # Ver amistades enviadas
        print(f"\n👥 Amistades enviadas por {user.alias}:")
        for fs in user.sent_friendships:
            print(f"   - {fs.receiver.alias} | Estado: {fs.status}")

        # Ver amistades recibidas
        print(f"\n👥 Amistades recibidas por {user.alias}:")
        for fs in user.received_friendships:
            print(f"   - {fs.requester.alias} | Estado: {fs.status}")

if __name__ == "__main__":
    test_relations()