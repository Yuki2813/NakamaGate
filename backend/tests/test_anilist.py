import httpx
from sqlmodel import Session, select
from database import engine
from models.users import Users
from models.review import Review
from models.friendship import Friendship
from models.favorite import Favorite
from models.userfavorite import UserFavorite

ANILIST_URL = "https://graphql.anilist.co"

def get_anime_info(id_api: int):
    query = """
    query ($id: Int) {
        Media(id: $id) {
            id
            idMal
            title {
                romaji
                english
            }
            type
            averageScore
        }
    }
    """
    response = httpx.post(ANILIST_URL, json={"query": query, "variables": {"id": id_api}})
    data = response.json()
    
    if not data.get("data") or not data["data"].get("Media"):
        return None
    return data["data"]["Media"]

def test_with_anilist():
    with Session(engine) as session:

        user = session.exec(select(Users).where(Users.alias == "yago")).first()
        print(f"\n👤 Usuario: {user.alias}")

        print(f"\n⭐ Favoritos de {user.alias} con info de AniList:")
        for uf in user.favorites:
            info = get_anime_info(uf.favorite.id_api)
            if not info:
                print(f"   - ID {uf.favorite.id_api} no encontrado en AniList")
                continue
            title = info["title"]["english"] or info["title"]["romaji"]
            mal_id = info["idMal"]
            print(f"   - {title} | MAL ID: {mal_id} | Tipo: {info['type']} | Score AniList: {info['averageScore']} | Estado tuyo: {uf.status.value}")

        print(f"\n📝 Reviews de {user.alias} con info de AniList:")
        for review in user.reviews:
            info = get_anime_info(review.id_api)
            if not info:
                print(f"   - ID {review.id_api} no encontrado en AniList")
                continue
            title = info["title"]["english"] or info["title"]["romaji"]
            mal_id = info["idMal"]
            print(f"   - {title} | MAL ID: {mal_id} | Tu puntuación: {review.score}/5 | Tu comentario: {review.content}")

        print(f"\n👥 Amistades enviadas por {user.alias}:")
        for fs in user.sent_friendships:
            print(f"   - {fs.receiver.alias} | Estado: {fs.status.value}")

        print(f"\n👥 Amistades recibidas por {user.alias}:")
        for fs in user.received_friendships:
            print(f"   - {fs.requester.alias} | Estado: {fs.status.value}")

if __name__ == "__main__":
    test_with_anilist()