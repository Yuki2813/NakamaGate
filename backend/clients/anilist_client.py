from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from backend.services.adapter.anilist_adapter import MediaAdapter

class AniListClient:
    def __init__(self):

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
            
            return {
                "top_animes": MediaAdapter.list_to_standar_format(result.get("topAnimes", {}).get("media")),
                "top_mangas": MediaAdapter.list_to_standar_format(result.get("topMangas", {}).get("media")),
                "recommended": MediaAdapter.list_to_standar_format(result.get("genreRecommended", {}).get("media"))
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
            return MediaAdapter.list_to_standar_format(raw_list)

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
            return MediaAdapter.to_standar_format(result.get("Media"))

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
            return MediaAdapter.list_to_standar_format(raw_list)
        


    # Añadimos genre: str = None como parámetro opcional
    async def get_directory_page(self, page: int, per_page: int, media_type: str, is_adult: bool, sort: str = "POPULARITY_DESC", genre: str = None):
        """Carga una página del directorio con soporte para paginación y filtrado por género"""
        query = gql("""
            # 1. Declaramos $genre como String en GraphQL
            query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort], $isAdult: Boolean, $genre: String) {
              Page(page: $page, perPage: $perPage) {
                pageInfo {
                  total currentPage lastPage hasNextPage
                }
                # 2. Le pasamos el genre al buscador de media
                media(type: $type, sort: $sort, isAdult: $isAdult, genre: $genre) {
                  id type title { romaji } coverImage { large } averageScore format seasonYear status genres
                }
              }
            }
        """)
        
        variables = {
            "page": page,
            "perPage": per_page,
            "type": media_type.upper(),
            "sort": [sort],
            "isAdult": is_adult
        }
        
        # 3. Si nos pasaron un género, lo añadimos a la petición
        if genre:
            variables["genre"] = genre
            
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            page_data = result.get("Page", {})
            return {
                "page_info": page_data.get("pageInfo", {}),
                "items": MediaAdapter.list_to_pro_format(page_data.get("media", []))
            }

# Instancia para exportar
anilist_client = AniListClient()