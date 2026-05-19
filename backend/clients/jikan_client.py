import asyncio
import time

import httpx

from backend.models.favorite import Mediatype
from backend.services.adapter.jikan_adapter import JikanAdapter

GENRE_IDS: dict[str, int] = {
    "Action": 1, "Adventure": 2, "Comedy": 4, "Drama": 8,
    "Ecchi": 9, "Fantasy": 10, "Horror": 14, "Mahou Shoujo": 16,
    "Mecha": 18, "Music": 19, "Mystery": 7, "Psychological": 40,
    "Romance": 22, "Sci-Fi": 24, "Slice of Life": 36, "Sports": 30,
    "Supernatural": 37, "Thriller": 41,
}


STATUS_ANIME = {"RELEASING": "airing", "FINISHED": "complete", "NOT_YET_RELEASED": "upcoming"}
STATUS_MANGA = {"RELEASING": "publishing", "FINISHED": "complete", "NOT_YET_RELEASED": "upcoming"}

# Mapea el sort interno al par (order_by, sort) que acepta Jikan.
SORT_MAP = {
    "POPULARITY_DESC": ("popularity", "asc"),   # rank 1 = más popular → asc pone el 1 primero
    "SCORE_DESC":      ("score",      "desc"),
    "TRENDING_DESC":   ("members",    "desc"),   # members es un contador, desc = más primero
}


class JikanClient:
    BASE_URL = "https://api.jikan.moe/v4"
    _SUMMARY_TTL = 86400 
    _FULL_TTL    = 86400   

    def __init__(self):
        self._semaphore = asyncio.Semaphore(1)
        self._summary_cache: dict = {}
        self._full_cache: dict = {}

    # ── Caché interna ─────────────────────────────────────────────────────────

    def _cache_get(self, store: dict, key: str, ttl: int):
        entry = store.get(key)
        if entry and (time.monotonic() - entry[0]) < ttl:
            return entry[1]
        return None

    def _cache_set(self, store: dict, key: str, value):
        store[key] = (time.monotonic(), value)

    # ── HTTP con rate-limit ────────────────────────────────────────────────────

    async def _get(self, path: str, params: dict = None) -> dict:
        """Una petición GET, serializada con el semáforo (≤ 3 req/s)."""
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.BASE_URL}{path}", params=params)
                resp.raise_for_status()
                data = resp.json()
            await asyncio.sleep(0.35)
        return data

    async def _safe_get(self, path: str, endpoint_name: str, default):
        """GET que devuelve `default` si Jikan falla, sin romper la llamada padre."""
        try:
            return await self._get(path)
        except httpx.HTTPError as exc:
            print(f"[jikan] {endpoint_name} falló: {exc.__class__.__name__}")
            return default

    # ── Métodos públicos ───────────────────────────────────────────────────────

    async def get_home_data(self, genres: list[str], pages: list[int]) -> dict:

        async def _trending_anime():
            top_anime_resp = await self._get("/top/anime", {"filter": "airing", "limit": 10})
            return JikanAdapter.list_to_standard_format(top_anime_resp.get("data", []), "ANIME")

        async def _trending_manga():
            top_manga_resp = await self._get("/top/manga", {"filter": "publishing", "limit": 10})
            return JikanAdapter.list_to_standard_format(top_manga_resp.get("data", []), "MANGA")

        async def _upcoming():
            upcoming_resp = await self._get("/seasons/upcoming", {"limit": 10})
            return JikanAdapter.list_to_standard_format(upcoming_resp.get("data", []), "ANIME")

        async def _genre_rec(genre: str, page: int):
            genre_id = GENRE_IDS.get(genre)
            if not genre_id:
                return []
            genre_resp = await self._get("/anime", {
                "genres": genre_id, "order_by": "popularity",
                "sort": "asc", "page": page, "limit": 20, "sfw": "true",
            })
            return JikanAdapter.list_to_standard_format(genre_resp.get("data", []), "ANIME")

        # zip hace una dubla de cada género con su página correspondiente, y lanzamos una tarea por cada pareja.
        genre_tasks = []
        for genre_name, page_num in zip(genres, pages):
            genre_tasks.append(_genre_rec(genre_name, page_num))

        results = await asyncio.gather(
            _trending_anime(),
            _trending_manga(),
            _upcoming(),
            *genre_tasks,
        )

        return {
            "upcoming":       results[2],
            "trending_anime": results[0],
            "trending_manga": results[1],
            "genre1": {"name": genres[0], "items": results[3]},
            "genre2": {"name": genres[1], "items": results[4]},
            "genre3": {"name": genres[2], "items": results[5]},
            "genre4": {"name": genres[3], "items": results[6]},
        }

    async def search_predictive(self, search_text: str, media_type: Mediatype) -> list:
        mtype = media_type.strip().lower()
        search_resp = await self._get(f"/{mtype}", {"q": search_text, "limit": 5, "sfw": "true"})
        return JikanAdapter.list_to_standard_format(search_resp.get("data", []), media_type.strip().upper())

    async def _get_summary(self, media_id: int, mtype: str) -> dict | None:
        """Info básica (1 llamada). Usada en batch/favoritos/stats."""
        key = f"{mtype}:{media_id}"
        cached = self._cache_get(self._summary_cache, key, self._SUMMARY_TTL)
        if cached is not None:
            return cached
        try:
            summary_resp = await self._get(f"/{mtype}/{media_id}")
            item = summary_resp.get("data")
            if not item:
                return None
            result = JikanAdapter.to_standard_format(item, mtype.upper())
        except httpx.HTTPStatusError:
            return None
        self._cache_set(self._summary_cache, key, result)
        return result

    async def get_media_details(self, media_id: int, media_type: str = "anime") -> dict | None:
        """Detalles completos. Usada en la página de detalle."""
        mtype = media_type.strip().lower()
        key = f"{mtype}:{media_id}"
        cached = self._cache_get(self._full_cache, key, self._FULL_TTL)
        if cached is not None:
            return cached

        # Petición principal: si /full falla no merece la pena seguir.
        full_resp = await self._safe_get(f"/{mtype}/{media_id}/full", "full", None)
        if not full_resp or not full_resp.get("data"):
            return None

        chars_resp = await self._safe_get(f"/{mtype}/{media_id}/characters", "characters", {"data": []})

        # Staff y videos solo aplican a anime; en manga se devuelven vacíos.
        # /videos sirve de fallback para el trailer cuando youtube_id viene null en /full.
        if mtype == "anime":
            staff_resp = await self._safe_get(f"/{mtype}/{media_id}/staff", "staff", {"data": []})
            videos_resp = await self._safe_get(f"/{mtype}/{media_id}/videos", "videos", {"data": {}})
        else:
            staff_resp = {"data": []}
            videos_resp = {"data": {}}

        item = full_resp["data"]

        # Jikan no incluye imágenes en las relaciones → las fetcheamos por separado.
        # Solo para tipos relevantes y máx 6 entradas para no reventar el rate limit.
        _relevant = {"Sequel", "Prequel", "Side story", "Parent story", "Spin-off",
                     "Alternative version", "Alternative setting"}
        rel_entries: list[tuple[int, str]] = []
        for group in (item.get("relations") or []):
            if group.get("relation") not in _relevant:
                continue
            for entry in (group.get("entry") or []):
                relation_id = entry.get("mal_id")
                relation_type = (entry.get("type") or "anime").lower()
                if relation_id:
                    rel_entries.append((relation_id, relation_type))
                if len(rel_entries) >= 6:
                    break
            if len(rel_entries) >= 6:
                break

        # Pide en paralelo el summary de cada relación para extraer su imagen.
        rel_image_map: dict[int, str | None] = {}
        if rel_entries:
            summary_tasks = []
            for relation_id, relation_type in rel_entries:
                summary_tasks.append(self._get_summary(relation_id, relation_type))
            summaries = await asyncio.gather(*summary_tasks, return_exceptions=True)
            for (relation_id, _), summary in zip(rel_entries, summaries):
                if isinstance(summary, dict) and summary:
                    rel_image_map[relation_id] = summary.get("image")

        result = JikanAdapter.to_standard_format(
            item,
            media_type=mtype.upper(),
            characters_data=chars_resp.get("data", []),
            staff_data=staff_resp.get("data", []),
            rel_image_map=rel_image_map,
            videos_data=videos_resp.get("data") or {},
        )
        self._cache_set(self._full_cache, key, result)
        self._cache_set(self._summary_cache, key, result)
        return result

    async def get_media_batch(self, ids: list[int], media_type: str = "anime") -> list:
        """Resuelve varios IDs en paralelo usando sólo 1 llamada por ítem."""
        if not ids:
            return []
        mtype = media_type.strip().lower()
        # Una tarea de summary por cada id solicitado.
        summary_tasks = []
        for media_id in ids:
            summary_tasks.append(self._get_summary(media_id, mtype))
        results = await asyncio.gather(*summary_tasks, return_exceptions=True)
        valid_results = []
        for item in results:
            if isinstance(item, dict) and item:
                valid_results.append(item)
        return valid_results

    async def get_directory_page(
        self, page: int, per_page: int, media_type: str,
        sort: str = "POPULARITY_DESC", genre: str = None, status: str = None,
    ) -> dict:
        mtype = media_type.strip().lower()
        order_by, sort_dir = SORT_MAP.get(sort, ("popularity", "desc"))

        params: dict = {
            "page": page, "limit": per_page,
            "order_by": order_by, "sort": sort_dir,
            "sfw": "true",
        }

        # Convierte los nombres de género recibidos a la lista de IDs de Jikan.
        if genre:
            genre_id_list = []
            for genre_chunk in genre.split(","):
                genre_name = genre_chunk.strip()
                if genre_name in GENRE_IDS:
                    genre_id_list.append(str(GENRE_IDS[genre_name]))
            if genre_id_list:
                params["genres"] = ",".join(genre_id_list)

        if status:
            if mtype == "anime":
                status_map = STATUS_ANIME
            else:
                status_map = STATUS_MANGA
            jikan_status = status_map.get(status.strip().upper())
            if jikan_status:
                params["status"] = jikan_status

        directory_resp = await self._get(f"/{mtype}", params)
        pagination = directory_resp.get("pagination", {})
        items_info = pagination.get("items", {})

        return {
            "page_info": {
                "total":       items_info.get("total", 0),
                "currentPage": pagination.get("current_page", page),
                "lastPage":    pagination.get("last_visible_page", 1),
                "hasNextPage": pagination.get("has_next_page", False),
            },
            "items": JikanAdapter.list_to_standard_format(directory_resp.get("data", []), media_type.strip().upper()),
        }


jikan_client = JikanClient()
