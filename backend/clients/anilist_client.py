from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from backend.services.adapter.anilist_adapter import MediaAdapter

class AniListClient:
    def __init__(self):
        # Transporte asíncrono para FastAPI
        self.transport = AIOHTTPTransport(url="https://graphql.anilist.co")
        self.client = Client(
            transport=self.transport, 
            
        )

    async def get_home_data(self, is_adult: bool, random_genre: str, excluded_genres: list[str]):
        """Carga la Home completa adaptada"""
        query = gql("""
            query ($isAdult: Boolean, $genre: String, $excluded: [String]) {
                topAnimes: Page(perPage: 6) {
                    media(type: ANIME, sort: SCORE_DESC, isAdult: $isAdult, genre_not_in: $excluded) {
                        id type title { romaji english } coverImage { large } averageScore
                    }
                }
                topMangas: Page(perPage: 6) {
                    media(type: MANGA, sort: SCORE_DESC, isAdult: $isAdult, genre_not_in: $excluded) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                genreRecommended: Page(perPage: 6) {
                    media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: $isAdult, genre_not_in: $excluded) {
                        id type title { romaji } coverImage { large } genres
                    }
                }
            }
        """)
        variables = {"isAdult": is_adult, "genre": random_genre, "excluded": excluded_genres}
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            
            # Adaptamos cada sección del diccionario de respuesta
            return {
                "top_animes": MediaAdapter.list_to_pro_format(result.get("topAnimes", {}).get("media")),
                "top_mangas": MediaAdapter.list_to_pro_format(result.get("topMangas", {}).get("media")),
                "recommended": MediaAdapter.list_to_pro_format(result.get("genreRecommended", {}).get("media"))
            }

    async def search_predictive(self, search_text: str, is_adult: bool, media_type: str):
        """Buscador optimizado para ser rápido y adaptado"""
        query = gql("""
            query ($search: String, $isAdult: Boolean, $type: MediaType) {
              Page(perPage: 5) {
                media(search: $search, type: $type, isAdult: $isAdult) {
                  id type title { romaji } coverImage { medium } format
                }
              }
            }
        """)
        variables = {"search": search_text, "isAdult": is_adult, "type": media_type}
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            raw_list = result.get("Page", {}).get("media", [])
            return MediaAdapter.list_to_pro_format(raw_list)

    async def get_media_details(self, media_id: int):
        """Ficha técnica completa adaptada"""
        query = gql("""
            query ($id: Int) {
              Media(id: $id) {
                id type title { romaji english native } description
                bannerImage coverImage { extraLarge } episodes chapters
                volumes status genres averageScore seasonYear isAdult
              }
            }
        """)
        variables = {"id": media_id}
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            return MediaAdapter.to_pro_format(result.get("Media"))

    async def get_media_batch(self, ids: list[int]):
        """Carga una lista (ej. favoritos) y la adapta"""
        if not ids: return []
        query = gql("""
            query ($ids: [Int]) {
              Page(perPage: 50) {
                media(id_in: $ids) {
                  id type title { romaji } coverImage { large } averageScore
                }
              }
            }
        """)
        variables = {"ids": ids}
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            raw_list = result.get("Page", {}).get("media", [])
            return MediaAdapter.list_to_pro_format(raw_list)

# Instancia para exportar
anilist_client = AniListClient()