class MediaAdapter:
    @staticmethod
    def to_standar_format(anilist_item: dict) -> dict:

        if not anilist_item:
            return {}

        units = anilist_item.get("episodes") or anilist_item.get("chapters")
        
        description = anilist_item.get("description", "")
        if description:
            description = description.replace("<br>", "\n").replace("<i>", "").replace("</i>", "")

        return {
            "id": anilist_item.get("id"),
            "type": anilist_item.get("type"), # 'ANIME' o 'MANGA'
            "title": anilist_item.get("title", {}).get("romaji"),
            "title_en": anilist_item.get("title", {}).get("english"),
            "image": anilist_item.get("coverImage", {}).get("extraLarge") or anilist_item.get("coverImage", {}).get("large"),
            "image_thumb": anilist_item.get("coverImage", {}).get("medium"),
            "banner": anilist_item.get("bannerImage"),
            "score": anilist_item.get("averageScore", 0),
            "status": anilist_item.get("status"),
            "description": description,
            "units": units if units else 0,
            "genres": anilist_item.get("genres", []),
            "year": anilist_item.get("startDate", {}).get("year", "N/A"),
            "is_adult": anilist_item.get("isAdult", False)
        }

    @staticmethod
    def list_to_standar_format(anilist_list: list) -> list:
        if not anilist_list:
            return []
        lista_formateada = []
        for item in anilist_list:
            if item:
                item_standar = MediaAdapter.to_standar_format(item)
                lista_formateada.append(item_standar)
                
        return lista_formateada