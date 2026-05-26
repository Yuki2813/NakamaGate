import re

class MediaAdapter:

    @staticmethod
    def _clean_html(text: str) -> str:
        if not text:
            return ""
        text = text.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def to_standar_format(anilist_item: dict) -> dict:
        if not anilist_item:
            return {}

        units = anilist_item.get("episodes")
        if not units:
            units = anilist_item.get("chapters")

        trailer_raw = anilist_item.get("trailer")
        trailer = None
        if trailer_raw and trailer_raw.get("site", "").lower() == "youtube":
            trailer = {
                "id":        trailer_raw["id"],
                "url":       f"https://www.youtube.com/embed/{trailer_raw['id']}",
                "thumbnail": trailer_raw.get("thumbnail"),
            }

        external_links = anilist_item.get("externalLinks")
        if external_links is None:
            external_links = []

        streaming = []
        for link in external_links:
            if link.get("type") == "STREAMING":
                streaming.append({
                    "site":  link.get("site"),
                    "url":   link.get("url"),
                    "color": link.get("color"),
                    "icon":  link.get("icon"),
                })

        characters_data = anilist_item.get("characters")
        if characters_data is None:
            characters_data = {}

        char_nodes = characters_data.get("nodes")
        if char_nodes is None:
            char_nodes = []

        char_edges = characters_data.get("edges")
        if char_edges is None:
            char_edges = []

        characters = []
        for node, edge in zip(char_nodes, char_edges):
            node_name = node.get("name")
            if node_name is None:
                node_name = {}

            node_image = node.get("image")
            if node_image is None:
                node_image = {}

            characters.append({
                "id":    node.get("id"),
                "name":  node_name.get("full"),
                "image": node_image.get("medium"),
                "role":  edge.get("role"),
            })

        relations_data = anilist_item.get("relations")
        if relations_data is None:
            relations_data = {}

        rel_nodes = relations_data.get("nodes")
        if rel_nodes is None:
            rel_nodes = []

        rel_edges = relations_data.get("edges")
        if rel_edges is None:
            rel_edges = []

        relations = []
        for node, edge in zip(rel_nodes, rel_edges):
            rel_type = edge.get("relationType", "")
            if rel_type in ("SEQUEL", "PREQUEL", "SIDE_STORY", "SPIN_OFF", "PARENT", "ALTERNATIVE"):
                node_title = node.get("title")
                if node_title is None:
                    node_title = {}

                node_cover = node.get("coverImage")
                if node_cover is None:
                    node_cover = {}

                relations.append({
                    "id":       node.get("id"),
                    "title":    node_title.get("romaji"),
                    "image":    node_cover.get("medium"),
                    "type":     node.get("type"),
                    "format":   node.get("format"),
                    "relation": rel_type,
                })

        staff_data = anilist_item.get("staff")
        if staff_data is None:
            staff_data = {}

        staff_nodes = staff_data.get("nodes")
        if staff_nodes is None:
            staff_nodes = []

        staff_edges = staff_data.get("edges")
        if staff_edges is None:
            staff_edges = []

        staff = []
        for node, edge in zip(staff_nodes, staff_edges):
            node_name = node.get("name")
            if node_name is None:
                node_name = {}

            node_image = node.get("image")
            if node_image is None:
                node_image = {}

            staff.append({
                "id":    node.get("id"),
                "name":  node_name.get("full"),
                "image": node_image.get("medium"),
                "role":  edge.get("role"),
            })

        studios_data = anilist_item.get("studios")
        if studios_data is None:
            studios_data = {}

        studio_nodes = studios_data.get("nodes")
        if studio_nodes is None:
            studio_nodes = []

        studios = []
        for s in studio_nodes:
            studios.append({
                "id":   s.get("id"),
                "name": s.get("name"),
                "url":  s.get("siteUrl"),
            })

        title_data = anilist_item.get("title")
        if title_data is None:
            title_data = {}

        cover_data = anilist_item.get("coverImage")
        if cover_data is None:
            cover_data = {}

        image = cover_data.get("extraLarge")
        if not image:
            image = cover_data.get("large")

        score = anilist_item.get("averageScore")
        if not score:
            score = 0

        units_value = 0
        if units:
            units_value = units

        start_date = anilist_item.get("startDate")
        if start_date is None:
            start_date = {}
        year = start_date.get("year", "N/A")

        return {
            "id":          anilist_item.get("id"),
            "type":        anilist_item.get("type"),
            "title":       title_data.get("romaji"),
            "title_en":    title_data.get("english"),
            "image":       image,
            "image_thumb": cover_data.get("medium"),
            "banner":      anilist_item.get("bannerImage"),
            "score":       score,
            "status":      anilist_item.get("status"),
            "description": MediaAdapter._clean_html(anilist_item.get("description", "")),
            "units":       units_value,
            "genres":      anilist_item.get("genres", []),
            "year":        year,
            "is_adult":    anilist_item.get("isAdult", False),
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
        result = []
        for item in anilist_list:
            if item:
                result.append(MediaAdapter.to_standar_format(item))
        return result
