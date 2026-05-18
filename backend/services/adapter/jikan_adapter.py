import re

ANIME_STATUS_MAP = {
    "Currently Airing":   "RELEASING",
    "Finished Airing":    "FINISHED",
    "Not yet aired":      "NOT_YET_RELEASED",
}

MANGA_STATUS_MAP = {
    "Publishing":         "RELEASING",
    "Finished":           "FINISHED",
    "On Hiatus":          "HIATUS",
    "Discontinued":       "CANCELLED",
    "Not yet published":  "NOT_YET_RELEASED",
}

RELATION_MAP = {
    "Sequel":                "SEQUEL",
    "Prequel":               "PREQUEL",
    "Side story":            "SIDE_STORY",
    "Parent story":          "PARENT",
    "Spin-off":              "SPIN_OFF",
    "Alternative version":   "ALTERNATIVE",
    "Alternative setting":   "ALTERNATIVE",
}

RELEVANT_RELATIONS = {"SEQUEL", "PREQUEL", "SIDE_STORY", "SPIN_OFF", "PARENT", "ALTERNATIVE"}


class JikanAdapter:

    @staticmethod
    def _clean_text(text: str) -> str:
        if not text:
            return ""
        text = re.sub(r"\[Written by MAL Rewrite\]", "", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def to_standard_format(
        item: dict,
        media_type: str = "ANIME",
        characters_data: list = None,
        staff_data: list = None,
        rel_image_map: dict = None,
        videos_data: dict = None,
    ) -> dict:
        if not item:
            return {}

        mtype = media_type.strip().upper()
        status_raw = item.get("status") or ""
        status_map = ANIME_STATUS_MAP if mtype == "ANIME" else MANGA_STATUS_MAP
        status = status_map.get(status_raw, status_raw)

        # Jikan usa 0-10, el resto del proyecto espera 0-100 (igual que AniList)
        raw_score = item.get("score") or 0
        score = int(raw_score * 10) if raw_score else 0

        # Imágenes
        jpg = (item.get("images") or {}).get("jpg") or {}
        image_large = jpg.get("large_image_url") or jpg.get("image_url")
        image_thumb = jpg.get("image_url")

        # Año de estreno
        year = item.get("year")
        if not year:
            date_block = item.get("aired") or item.get("published") or {}
            date_str = (date_block.get("from") or "")[:4]
            year = int(date_str) if date_str.isdigit() else "N/A"

        # Episodios / capítulos
        units = item.get("episodes") or item.get("chapters") or 0

        # Géneros (solo la lista "genres", no themes ni demographics)
        genres = [g["name"] for g in (item.get("genres") or [])]

        # Contenido adulto: solo hentai (Rx). Ecchi se filtra en el servicio por género.
        rating = item.get("rating") or ""
        is_adult = "Rx" in rating

        # Tráiler: youtube_id directo → embed_url → PV de /videos
        def _extract_yt_id(raw: dict) -> str | None:
            yt = raw.get("youtube_id")
            if yt:
                return yt
            embed = raw.get("embed_url") or ""
            m = re.search(r"/embed/([^?&]+)", embed)
            return m.group(1) if m else None

        trailer = None
        trailer_raw = item.get("trailer") or {}
        yt_id = _extract_yt_id(trailer_raw)

        if not yt_id and videos_data:
            for promo in ((videos_data or {}).get("promo") or []):
                pv_raw = promo.get("trailer") or {}
                yt_id = _extract_yt_id(pv_raw)
                if yt_id:
                    trailer_raw = pv_raw
                    break

        if yt_id:
            thumb = ((trailer_raw.get("images") or {}).get("medium_image_url"))
            trailer = {
                "id":        yt_id,
                "url":       f"https://www.youtube.com/embed/{yt_id}",
                "thumbnail": thumb,
            }

        # Plataformas de streaming
        streaming = [
            {"site": s.get("name"), "url": s.get("url"), "color": None, "icon": None}
            for s in (item.get("streaming") or [])
        ]

        # Personajes (máx 6, de la llamada separada /characters)
        characters = []
        for c in (characters_data or [])[:6]:
            char = c.get("character") or {}
            char_jpg = ((char.get("images") or {}).get("jpg") or {})
            characters.append({
                "id":    char.get("mal_id"),
                "name":  char.get("name"),
                "image": char_jpg.get("image_url"),
                "role":  (c.get("role") or "").upper(),
            })

        # Relaciones narrativas (de /full); imágenes vienen del rel_image_map del cliente
        _rel_images = rel_image_map or {}
        relations = []
        for group in (item.get("relations") or []):
            rel_type = RELATION_MAP.get(group.get("relation", ""))
            if rel_type not in RELEVANT_RELATIONS:
                continue
            for entry in (group.get("entry") or []):
                rid = entry.get("mal_id")
                relations.append({
                    "id":       rid,
                    "title":    entry.get("name"),
                    "image":    _rel_images.get(rid),
                    "type":     (entry.get("type") or "").upper(),
                    "format":   None,
                    "relation": rel_type,
                })

        # Staff (máx 6, solo anime). Priorizamos roles creativos sobre productores.
        _priority = {
            "Director": 0, "Series Director": 0, "Chief Director": 0,
            "Script": 1, "Series Composition": 1, "Screenplay": 1,
            "Character Design": 2, "Original Character Design": 2,
            "Music": 3, "Sound Director": 3,
            "Animation Director": 4, "Chief Animation Director": 4,
            "Art Director": 5, "Color Design": 5,
        }
        def _staff_priority(s):
            positions = s.get("positions") or []
            role = positions[0] if positions else ""
            return _priority.get(role, 99)

        sorted_staff = sorted(staff_data or [], key=_staff_priority)
        staff = []
        for s in sorted_staff[:6]:
            person = s.get("person") or {}
            p_jpg = ((person.get("images") or {}).get("jpg") or {})
            positions = s.get("positions") or []
            staff.append({
                "id":    person.get("mal_id"),
                "name":  person.get("name"),
                "image": p_jpg.get("image_url"),
                "role":  positions[0] if positions else None,
            })

        # Estudio principal (solo anime)
        studios = [
            {"id": st.get("mal_id"), "name": st.get("name"), "url": st.get("url")}
            for st in (item.get("studios") or [])
        ]

        return {
            "id":          item.get("mal_id"),
            "type":        mtype,
            "title":       item.get("title") or "",
            "title_en":    item.get("title_english"),
            "image":       image_large,
            "image_thumb": image_thumb,
            "banner":      None,    # Jikan no provee banner
            "score":       score,
            "status":      status,
            "description": JikanAdapter._clean_text(item.get("synopsis", "")),
            "units":       units,
            "genres":      genres,
            "year":        year or "N/A",
            "is_adult":    is_adult,
            "trailer":     trailer,
            "streaming":   streaming,
            "characters":  characters,
            "relations":   relations,
            "staff":       staff,
            "studios":     studios,
        }

    @staticmethod
    def list_to_standard_format(items: list, media_type: str = "ANIME") -> list:
        if not items:
            return []
        return [
            JikanAdapter.to_standard_format(item, media_type)
            for item in items
            if item
        ]
