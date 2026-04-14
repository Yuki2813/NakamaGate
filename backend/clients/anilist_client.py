from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from graphql import GraphQLError
from backend.models.favorite import Mediatype
from backend.services.adapter.anilist_adapter import MediaAdapter

class AniListClient:
    def __init__(self):

        self.transport = AIOHTTPTransport(url="https://graphql.anilist.co")
        self.client = Client(
            transport=self.transport, 
            
        )

    async def get_home_data(self, genres: list[str]):

        query = gql("""
            query ($g1: String, $g2: String, $g3: String) {
                topAnimes: Page(perPage: 10) {
                    media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
                        id title { romaji } coverImage { large } averageScore
                    }
                }
                topMangas: Page(perPage: 10) {
                    media(type: MANGA, sort: SCORE_DESC, isAdult: false) {
                        id title { romaji } coverImage { large } averageScore
                    }
                }
                rec1: Page(perPage: 20) { # Pedimos 20 para luego elegir 6 al azar
                    media(type: ANIME, genre: $g1, sort: POPULARITY_DESC, isAdult: false) {
                        id title { romaji } coverImage { large } genres
                    }
                }
                rec2: Page(perPage: 20) {
                    media(type: ANIME, genre: $g2, sort: POPULARITY_DESC, isAdult: false) {
                        id title { romaji } coverImage { large } genres
                    }
                }
                rec3: Page(perPage: 20) {
                    media(type: ANIME, genre: $g3, sort: POPULARITY_DESC, isAdult: false) {
                        id title { romaji } coverImage { large } genres
                    }
                }
            }
        """)
        
        variables = {"g1": genres[0], "g2": genres[1], "g3": genres[2]}
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            
            return {
                "top_animes": MediaAdapter.list_to_standar_format(result.get("topAnimes", {}).get("media")),
                "top_mangas": MediaAdapter.list_to_standar_format(result.get("topMangas", {}).get("media")),
                "genre1": {
                    "name": genres[0],
                    "items": MediaAdapter.list_to_standar_format(result.get("rec1", {}).get("media"))
                },
                "genre2": {
                    "name": genres[1],
                    "items": MediaAdapter.list_to_standar_format(result.get("rec2", {}).get("media"))
                },
                "genre3": {
                    "name": genres[2],
                    "items": MediaAdapter.list_to_standar_format(result.get("rec3", {}).get("media"))
                }
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
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            raw_list = result.get("Page", {}).get("media", [])
            return MediaAdapter.list_to_standar_format(raw_list)

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
            async with self.client as session:
                result = await session.execute(query, variable_values=variables)
                media_data = result.get("Media")
                
                if not media_data:
                    return None
                    
                return MediaAdapter.to_standar_format(media_data)

        except GraphQLError:

            return None

    async def get_media_batch(self, ids: list[int], media_type: str = None):
        if not ids: 
            return []

        # 2. Modificamos la query para que acepte el parámetro $type
        query = gql("""
            query ($ids: [Int], $type: MediaType) {
            Page(perPage: 50) {
                media(id_in: $ids, type: $type) {
                id 
                type 
                title { romaji } 
                coverImage { large } 
                averageScore
                }
            }
            }
        """)

        # 3. Pasamos el tipo a las variables
        variables = {
            "ids": ids,
            "type": media_type  # Aquí llegará "ANIME" o "MANGA"
        }
        
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            raw_list = result.get("Page", {}).get("media", [])
            return MediaAdapter.list_to_standar_format(raw_list)


    async def get_directory_page(self, page: int, per_page: int, media_type: str, sort: str = "POPULARITY_DESC", genre: str = None):
        query = gql("""
            # 1. Declaramos $genre como String en GraphQL
            query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort],  $genre: String) {
              Page(page: $page, perPage: $perPage) {
                pageInfo {
                  total currentPage lastPage hasNextPage
                }
                # 2. Le pasamos el genre al buscador de media
                media(type: $type, sort: $sort, isAdult: false, genre: $genre) {
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
            variables["genre"] = genre
            
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
            page_data = result.get("Page", {})
            return {
                "page_info": page_data.get("pageInfo", {}),
                "items": MediaAdapter.list_to_standar_format(page_data.get("media", []))
            }


anilist_client = AniListClient()