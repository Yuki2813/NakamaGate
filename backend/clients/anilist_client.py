from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from graphql import GraphQLError
from backend.models.favorite import Mediatype
from backend.services.adapter.anilist_adapter import MediaAdapter

class AniListClient:
    def __init__(self):
        pass

    def _get_fresh_client(self):
        transport = AIOHTTPTransport(url="https://graphql.anilist.co")
        return Client(transport=transport, fetch_schema_from_transport=False)

    async def get_home_data(self, genres: list[str], pages: list[int]):
        query = gql("""
            query ($g1: String, $g2: String, $g3: String, $g4: String, $p1: Int, $p2: Int, $p3: Int, $p4: Int) {
                upcoming: Page(perPage: 10) {
                    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                trendingAnime: Page(perPage: 10) {
                    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                trendingMangas: Page(perPage: 10) {
                    media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
                        id type title { romaji } coverImage { large } averageScore
                    }
                }
                rec1: Page(page: $p1, perPage: 20) { media(type: ANIME, genre: $g1, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec2: Page(page: $p2, perPage: 20) { media(type: ANIME, genre: $g2, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec3: Page(page: $p3, perPage: 20) { media(type: ANIME, genre: $g3, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
                rec4: Page(page: $p4, perPage: 20) { media(type: ANIME, genre: $g4, sort: POPULARITY_DESC, isAdult: false) { id type title { romaji } coverImage { large } averageScore } }
            }
        """)
        variables = {
            "g1": genres[0], "g2": genres[1], "g3": genres[2], "g4": genres[3],
            "p1": pages[0],  "p2": pages[1],  "p3": pages[2],  "p4": pages[3]
        }
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            return {
                "upcoming":       MediaAdapter.list_to_standar_format(result.get("upcoming", {}).get("media")),
                "trending_anime": MediaAdapter.list_to_standar_format(result.get("trendingAnime", {}).get("media")),
                "trending_manga": MediaAdapter.list_to_standar_format(result.get("trendingMangas", {}).get("media")),
                "genre1": {"name": genres[0], "items": MediaAdapter.list_to_standar_format(result.get("rec1", {}).get("media"))},
                "genre2": {"name": genres[1], "items": MediaAdapter.list_to_standar_format(result.get("rec2", {}).get("media"))},
                "genre3": {"name": genres[2], "items": MediaAdapter.list_to_standar_format(result.get("rec3", {}).get("media"))},
                "genre4": {"name": genres[3], "items": MediaAdapter.list_to_standar_format(result.get("rec4", {}).get("media"))},
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
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            return MediaAdapter.list_to_standar_format(result.get("Page", {}).get("media", []))

    async def get_media_details(self, media_id: int):
        query = gql("""
            query ($id: Int) {
              Media(id: $id) {
                id
                type
                title { romaji english native }
                description
                bannerImage
                coverImage { extraLarge }
                episodes
                chapters
                volumes
                status
                genres
                averageScore
                startDate { year }
                isAdult

                trailer { id site thumbnail }
                externalLinks { url site color icon type }
                characters(perPage: 6, sort: [ROLE, RELEVANCE]) {
                  nodes { id name { full } image { medium } }
                  edges { role }
                }
                relations {
                  nodes {
                    id type format
                    title { romaji }
                    coverImage { medium }
                  }
                  edges { relationType }
                }
                staff(perPage: 6, sort: [RELEVANCE]) {
                  nodes { id name { full } image { medium } }
                  edges { role }
                }
                studios(isMain: true) {
                  nodes { id name siteUrl }
                }
              }
            }
        """)
        variables = {"id": media_id}
        try:
            async with self._get_fresh_client() as session:
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
        per_page = min(len(ids), 50)
        query = gql("""
            query ($ids: [Int], $type: MediaType, $perPage: Int) {
              Page(perPage: $perPage) {
                media(id_in: $ids, type: $type) {
                  id type title { romaji } coverImage { large } averageScore genres
                }
              }
            }
        """)
        variables = {"ids": ids, "type": media_type, "perPage": per_page}
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            return MediaAdapter.list_to_standar_format(result.get("Page", {}).get("media", []))

    async def get_directory_page(self, page: int, per_page: int, media_type: str, sort: str = "POPULARITY_DESC", genre: str = None, status: str = None):
        query = gql("""
            query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort], $genreIn: [String], $status: MediaStatus) {
              Page(page: $page, perPage: $perPage) {
                pageInfo { total currentPage lastPage hasNextPage }
                media(type: $type, sort: $sort, isAdult: false, genre_in: $genreIn, status: $status) {
                  id type title { romaji } coverImage { large } averageScore format seasonYear status genres
                }
              }
            }
        """)
        variables = {
            "page": page, "perPage": per_page,
            "type": media_type.strip().upper(), 
            "sort": [sort], # Aquí usaremos POPULARITY_DESC por defecto
        }
        if genre:
            genre_list = []
            for g in genre.split(","):
                genre_list.append(g.strip())
            variables["genreIn"] = genre_list
        if status:
            variables["status"] = status.strip().upper()
        async with self._get_fresh_client() as session:
            result = await session.execute(query, variable_values=variables)
            page_data = result.get("Page", {})
            return {
                "page_info": page_data.get("pageInfo", {}),
                "items":     MediaAdapter.list_to_standar_format(page_data.get("media", []))
            }

anilist_client = AniListClient()