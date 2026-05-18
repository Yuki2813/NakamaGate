import asyncio
import time

import httpx

from backend.models.favorite import Mediatype

GENRE_IDS: dict[str, int] = {
    "Action": 1, "Adventure": 2, "Comedy": 4, "Drama": 8,
    "Ecchi": 9, "Fantasy": 10, "Horror": 14, "Mahou Shoujo": 16,
    "Mecha": 18, "Music": 19, "Mystery": 7, "Psychological": 40,
    "Romance": 22, "Sci-Fi": 24, "Slice of Life": 36, "Sports": 30,
    "Supernatural": 37, "Thriller": 41,
}

STATUS_ANIME = {"RELEASING": "airing", "FINISHED": "complete", "NOT_YET_RELEASED": "upcoming"}
STATUS_MANGA = {"RELEASING": "publishing", "FINISHED": "complete", "NOT_YET_RELEASED": "upcoming"}

SORT_MAP = {
    "POPULARITY_DESC": ("popularity", "asc"),   # rank 1 = más popular → asc pone el 1 primero
    "SCORE_DESC":      ("score",      "desc"),
    "TRENDING_DESC":   ("members",    "desc"),   # members es un contador, desc = más primero
}


class JikanClient:
    BASE_URL = "https://api.jikan.moe/v4"
    _SUMMARY_TTL = 86400   # 24h — info básica (title, image, genres)
    _FULL_TTL    = 86400   # 24h — detalles completos (chars, staff, trailer…)

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

    # ── Métodos públicos ───────────────────────────────────────────────────────

    async def get_home_data(self, genres: list[str], pages: list[int]) -> dict:
        from backend.services.adapter.jikan_adapter import JikanAdapter

        async def _trending_anime():
            r = await self._get("/top/anime", {"filter": "airing", "limit": 10})
            return JikanAdapter.list_to_standard_format(r.get("data", []), "ANIME")

        async def _trending_manga():
            r = await self._get("/top/manga", {"filter": "publishing", "limit": 10})
            return JikanAdapter.list_to_standard_format(r.get("data", []), "MANGA")

        async def _upcoming():
            r = await self._get("/seasons/upcoming", {"limit": 10})
            return JikanAdapter.list_to_standard_format(r.get("data", []), "ANIME")

        async def _genre_rec(genre: str, page: int):
            genre_id = GENRE_IDS.get(genre)
            if not genre_id:
                return []
            r = await self._get("/anime", {
                "genres": genre_id, "order_by": "popularity",
                "sort": "asc", "page": page, "limit": 20, "sfw": "true",
            })
            return JikanAdapter.list_to_standard_format(r.get("data", []), "ANIME")

        results = await asyncio.gather(
            _trending_anime(),
            _trending_manga(),
            _upcoming(),
            *[_genre_rec(g, p) for g, p in zip(genres, pages)],
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
        from backend.services.adapter.jikan_adapter import JikanAdapter
        mtype = media_type.strip().lower()
        r = await self._get(f"/{mtype}", {"q": search_text, "limit": 5, "sfw": "true"})
        return JikanAdapter.list_to_standard_format(r.get("data", []), media_type.strip().upper())

    async def _get_summary(self, media_id: int, mtype: str) -> dict | None:
        """Info básica (1 llamada). Usada en batch/favoritos/stats."""
        from backend.services.adapter.jikan_adapter import JikanAdapter
        key = f"{mtype}:{media_id}"
        cached = self._cache_get(self._summary_cache, key, self._SUMMARY_TTL)
        if cached is not None:
            return cached
        try:
            r = await self._get(f"/{mtype}/{media_id}")
            item = r.get("data")
            if not item:
                return None
            result = JikanAdapter.to_standard_format(item, mtype.upper())
        except httpx.HTTPStatusError:
            return None
        self._cache_set(self._summary_cache, key, result)
        return result

    async def get_media_details(self, media_id: int, media_type: str = "anime") -> dict | None:
        """Detalles completos. Usada en la página de detalle."""
        from backend.services.adapter.jikan_adapter import JikanAdapter
        mtype = media_type.strip().lower()
        key = f"{mtype}:{media_id}"
        cached = self._cache_get(self._full_cache, key, self._FULL_TTL)
        if cached is not None:
            return cached

        async def _empty():
            return {"data": []}

        # return_exceptions=True: si alguna llamada falla, seguimos con lo que hay.
        # /videos como fallback para trailer cuando youtube_id viene null en /full.
        results = await asyncio.gather(
            self._get(f"/{mtype}/{media_id}/full"),
            self._get(f"/{mtype}/{media_id}/characters"),
            self._get(f"/{mtype}/{media_id}/staff")   if mtype == "anime" else _empty(),
            self._get(f"/{mtype}/{media_id}/videos")  if mtype == "anime" else _empty(),
            return_exceptions=True,
        )

        full_r   = results[0] if not isinstance(results[0], Exception) else None
        chars_r  = results[1] if not isinstance(results[1], Exception) else {"data": []}
        staff_r  = results[2] if not isinstance(results[2], Exception) else {"data": []}
        videos_r = results[3] if not isinstance(results[3], Exception) else {"data": {}}

        if not full_r or not full_r.get("data"):
            return None

        item = full_r["data"]

        # Jikan no incluye imágenes en las relaciones → las fetcheamos por separado.
        # Solo para tipos relevantes y máx 6 entradas para no reventar el rate limit.
        _relevant = {"Sequel", "Prequel", "Side story", "Parent story", "Spin-off",
                     "Alternative version", "Alternative setting"}
        rel_entries: list[tuple[int, str]] = []
        for group in (item.get("relations") or []):
            if group.get("relation") not in _relevant:
                continue
            for entry in (group.get("entry") or []):
                rid = entry.get("mal_id")
                rtype = (entry.get("type") or "anime").lower()
                if rid:
                    rel_entries.append((rid, rtype))
                if len(rel_entries) >= 6:
                    break
            if len(rel_entries) >= 6:
                break

        rel_image_map: dict[int, str | None] = {}
        if rel_entries:
            summaries = await asyncio.gather(
                *[self._get_summary(rid, rtype) for rid, rtype in rel_entries],
                return_exceptions=True,
            )
            for (rid, _), summary in zip(rel_entries, summaries):
                if isinstance(summary, dict) and summary:
                    rel_image_map[rid] = summary.get("image")

        result = JikanAdapter.to_standard_format(
            item,
            media_type=mtype.upper(),
            characters_data=chars_r.get("data", []),
            staff_data=staff_r.get("data", []),
            rel_image_map=rel_image_map,
            videos_data=videos_r.get("data") or {},
        )
        self._cache_set(self._full_cache, key, result)
        self._cache_set(self._summary_cache, key, result)
        return result

    async def get_media_batch(self, ids: list[int], media_type: str = "anime") -> list:
        """Resuelve varios IDs en paralelo usando sólo 1 llamada por ítem."""
        if not ids:
            return []
        mtype = media_type.strip().lower()
        tasks = [self._get_summary(mid, mtype) for mid in ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, dict) and r]

    async def get_directory_page(
        self, page: int, per_page: int, media_type: str,
        sort: str = "POPULARITY_DESC", genre: str = None, status: str = None,
    ) -> dict:
        from backend.services.adapter.jikan_adapter import JikanAdapter
        mtype = media_type.strip().lower()
        order_by, sort_dir = SORT_MAP.get(sort, ("popularity", "desc"))

        params: dict = {
            "page": page, "limit": per_page,
            "order_by": order_by, "sort": sort_dir,
            "sfw": "true",
        }

        if genre:
            ids = [str(GENRE_IDS[g.strip()]) for g in genre.split(",") if g.strip() in GENRE_IDS]
            if ids:
                params["genres"] = ",".join(ids)

        if status:
            status_map = STATUS_ANIME if mtype == "anime" else STATUS_MANGA
            jikan_status = status_map.get(status.strip().upper())
            if jikan_status:
                params["status"] = jikan_status

        r = await self._get(f"/{mtype}", params)
        pagination = r.get("pagination", {})
        items_info = pagination.get("items", {})

        return {
            "page_info": {
                "total":       items_info.get("total", 0),
                "currentPage": pagination.get("current_page", page),
                "lastPage":    pagination.get("last_visible_page", 1),
                "hasNextPage": pagination.get("has_next_page", False),
            },
            "items": JikanAdapter.list_to_standard_format(r.get("data", []), media_type.strip().upper()),
        }


jikan_client = JikanClient()
