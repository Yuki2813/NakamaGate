from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from graphql import GraphQLError
from backend.models.favorite import Mediatype
from backend.services.adapter.anilist_adapter import MediaAdapter

class AniListClient:
    def __init__(self):
        # Ya no creamos el cliente aquí para evitar que se quede "atascado"
        pass

    # ==========================================
    # 🌟 EL SALVAVIDAS: Crea una conexión limpia
    # ==========================================
    def _get_fresh_client(self):
        transport = AIOHTTPTransport(url="https://graphql.anilist.co")
        return Client(transport=transport, fetch_schema_from_transport=False)

    async def get_home_data(self, genres: list[str], pages: list[int]):
        query = gql("""
            query ($g1: String, $g2: String, $g3: String, $g4: String, $g5: String, $p1: Int, $p2: Int, $p3: Int, $p4: Int, $p5: Int) {
                upcoming: Page(perPage: 20) {
                    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                trending: Page(perPage: 20) {
                    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                topAnimes: Page(perPage: 20) {
                    media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                topMangas: Page(perPage: 20) {
                    media(type: MANGA, sort: SCORE_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                rec1: Page(page: $p1, perPage: 20) { media(type: ANIME, genre: $g1, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec2: Page(page: $p2, perPage: 20) { media(type: ANIME, genre: $g2, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec3: Page(page: $p3, perPage: 20) { media(type: ANIME, genre: $g3, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec4: Page(page: $p4, perPage: 20) { media(type: ANIME, genre: $g4, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec5: Page(page: $p5, perPage: 20) { media(type: ANIME, genre: $g5, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
            }
        """)
        
        variables = {
            "g1": genres[0], "g2": genres[1], "g3": genres[2], "g4": genres[3], "g5": genres[4],
            "p1": pages[0], "p2": pages[1], "p3": pages[2], "p4": pages[3], "p5": pages[4]
        }
        
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            
            return {
                "upcoming": MediaAdapter.list_to_standar_format(result.get("upcoming", {}).get("media")),
                "trending": MediaAdapter.list_to_standar_format(result.get("trending", {}).get("media")),
                "top_animes": MediaAdapter.list_to_standar_format(result.get("topAnimes", {}).get("media")),
                "top_mangas": MediaAdapter.list_to_standar_format(result.get("topMangas", {}).get("media")),
                "genre1": { "name": genres[0], "items": MediaAdapter.list_to_standar_format(result.get("rec1", {}).get("media")) },
                "genre2": { "name": genres[1], "items": MediaAdapter.list_to_standar_format(result.get("rec2", {}).get("media")) },
                "genre3": { "name": genres[2], "items": MediaAdapter.list_to_standar_format(result.get("rec3", {}).get("media")) },
                "genre4": { "name": genres[3], "items": MediaAdapter.list_to_standar_format(result.get("rec4", {}).get("media")) },
                "genre5": { "name": genres[4], "items": MediaAdapter.list_to_standar_format(result.get("rec5", {}).get("media")) }
            }

    async def search_predictive(self, search_text: str, media_type: Mediatype):
        query = gql("""
            query ($search: String, $type: MediaType) {
              Page(perPage: 5) {
                media(search: $search, type: $type, isAdult: false) {
                  id type title { romaji } coverImage { medium } format startDate { year }
                }
              }
            }
        """)
        variables = {"search": search_text, "type": media_type.strip().upper()}
        
        # ✅ APLICADO AQUÍ
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            raw_list = result.get("Page", {}).get("media", [])
            formatted_result = MediaAdapter.list_to_standar_format(raw_list)
            return formatted_result

    async def get_media_details(self, media_id: int):
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
        
        try:
            # ✅ APLICADO AQUÍ
            async with self._get_fresh_client() as session:
                result = await session.execute(query, variable_values=variables)
                media_data = result.get("Media")
                
                if not media_data:
                    return None
                    
                formatted_result = MediaAdapter.to_standar_format(media_data)
                return formatted_result
        except GraphQLError:
            return None

    async def get_media_batch(self, ids: list[int], media_type: str = None):
        if not ids: 
            return []

        query = gql("""
            query ($ids: [Int], $type: MediaType) {
            Page(perPage: 50) {
                media(id_in: $ids, type: $type) {
                id 
                type 
                title { romaji } 
                coverImage { large } 
                averageScore
                genres
                }
            }
            }
        """)

        variables = {
            "ids": ids,
            "type": media_type
        }
        
        # ✅ APLICADO AQUÍ
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            raw_list = result.get("Page", {}).get("media", [])
            return MediaAdapter.list_to_standar_format(raw_list)

    async def get_directory_page(self, page: int, per_page: int, media_type: str, sort: str = "POPULARITY_DESC", genre: str = None):
        query = gql("""
            query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort], $genreIn: [String]) {
              Page(page: $page, perPage: $perPage) {
                pageInfo {
                  total currentPage lastPage hasNextPage
                }
                media(type: $type, sort: $sort, isAdult: false, genre_in: $genreIn) {
                  id type title { romaji } coverImage { large } averageScore format seasonYear status genres
                }
              }
            }
        """)
        
        variables = {
            "page": page,
            "perPage": per_page,
            "type": media_type.strip().upper(),
            "sort": [sort],
        }
        
        if genre:
            lista_generos = []
            for g in genre.split(","):
                lista_generos.append(g.strip())
            variables["genreIn"] = lista_generos
            
        # ✅ APLICADO AQUÍ
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            page_data = result.get("Page", {})
            return {
                "page_info": page_data.get("pageInfo", {}),
                "items": MediaAdapter.list_to_standar_format(page_data.get("media", []))
            }

anilist_client = AniListClient()