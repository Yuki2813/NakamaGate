import re

class MediaAdapter:
    @staticmethod
    def _clean_html(text: str) -> str:
        if not text:
            return ""
        text = text.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
        text = re.sub(r"<[^>]+>", "", text)   # elimina cualquier otro tag HTML
        text = re.sub(r"\n{3,}", "\n\n", text) # colapsa saltos de línea excesivos
        return text.strip()

    @staticmethod
    def to_standar_format(anilist_item: dict) -> dict:
        if not anilist_item:
            return {}

        units = anilist_item.get("episodes") or anilist_item.get("chapters")

        # ── Trailer ──────────────────────────────────
        # AniList devuelve { id, site, thumbnail }
        # Solo procesamos YouTube (que es casi siempre)
        trailer_raw = anilist_item.get("trailer")
        trailer = None
        if trailer_raw and trailer_raw.get("site", "").lower() == "youtube":
            trailer = {
                "id":        trailer_raw["id"],
                "url":       f"https://www.youtube.com/embed/{trailer_raw['id']}",
                "thumbnail": trailer_raw.get("thumbnail"),
            }

        # ── Dónde verlo (solo links de tipo STREAMING) ──
        streaming = []
        for link in anilist_item.get("externalLinks") or []:
            if link.get("type") == "STREAMING":
                streaming.append({
                    "site":  link.get("site"),
                    "url":   link.get("url"),
                    "color": link.get("color"),   # color de marca de la plataforma
                    "icon":  link.get("icon"),    # icono SVG que da AniList
                })

        # ── Personajes principales ────────────────────
        characters = []
        char_nodes = (anilist_item.get("characters") or {}).get("nodes") or []
        char_edges = (anilist_item.get("characters") or {}).get("edges") or []
        for node, edge in zip(char_nodes, char_edges):
            characters.append({
                "id":    node.get("id"),
                "name":  (node.get("name") or {}).get("full"),
                "image": (node.get("image") or {}).get("medium"),
                "role":  edge.get("role"),   # MAIN / SUPPORTING / BACKGROUND
            })

        # ── Relaciones (secuelas, precuelas, spin-offs) ──
        relations = []
        rel_nodes = (anilist_item.get("relations") or {}).get("nodes") or []
        rel_edges = (anilist_item.get("relations") or {}).get("edges") or []
        for node, edge in zip(rel_nodes, rel_edges):
            rel_type = edge.get("relationType", "")
            # Filtramos solo las relaciones narrativas relevantes
            if rel_type in ("SEQUEL", "PREQUEL", "SIDE_STORY", "SPIN_OFF", "PARENT", "ALTERNATIVE"):
                relations.append({
                    "id":       node.get("id"),
                    "title":    (node.get("title") or {}).get("romaji"),
                    "image":    (node.get("coverImage") or {}).get("medium"),
                    "type":     node.get("type"),      # ANIME / MANGA
                    "format":   node.get("format"),    # TV, MOVIE, OVA, MANGA…
                    "relation": rel_type,
                })

        # ── Staff relevante ───────────────────────────
        staff = []
        staff_nodes = (anilist_item.get("staff") or {}).get("nodes") or []
        staff_edges = (anilist_item.get("staff") or {}).get("edges") or []
        for node, edge in zip(staff_nodes, staff_edges):
            staff.append({
                "id":    node.get("id"),
                "name":  (node.get("name") or {}).get("full"),
                "image": (node.get("image") or {}).get("medium"),
                "role":  edge.get("role"),  # "Director", "Original Creator", etc.
            })

        # ── Estudio principal ─────────────────────────
        studios = [
            {"id": s.get("id"), "name": s.get("name"), "url": s.get("siteUrl")}
            for s in ((anilist_item.get("studios") or {}).get("nodes") or [])
        ]

        return {
            # ── Campos existentes ──────────────────────
            "id":          anilist_item.get("id"),
            "type":        anilist_item.get("type"),
            "title":       (anilist_item.get("title") or {}).get("romaji"),
            "title_en":    (anilist_item.get("title") or {}).get("english"),
            "image":       (anilist_item.get("coverImage") or {}).get("extraLarge")
                           or (anilist_item.get("coverImage") or {}).get("large"),
            "image_thumb": (anilist_item.get("coverImage") or {}).get("medium"),
            "banner":      anilist_item.get("bannerImage"),
            "score":       anilist_item.get("averageScore") or 0,
            "status":      anilist_item.get("status"),
            "description": MediaAdapter._clean_html(anilist_item.get("description", "")),
            "units":       units if units else 0,
            "genres":      anilist_item.get("genres", []),
            "year":        (anilist_item.get("startDate") or {}).get("year", "N/A"),
            "is_adult":    anilist_item.get("isAdult", False),
            # ── Campos nuevos ──────────────────────────
            "trailer":    trailer,
            "streaming":  streaming,
            "characters": characters,
            "relations":  relations,
            "staff":      staff,
            "studios":    studios,
        }

    @staticmethod
    def list_to_standar_format(anilist_list: list) -> list:
        if not anilist_list:
            return []
        return [
            MediaAdapter.to_standar_format(item)
            for item in anilist_list
            if item
        ]