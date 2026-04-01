class MediaAdapter:
    @staticmethod
    def to_pro_format(anilist_item: dict) -> dict:
        """
        Transforma un objeto crudo de AniList a nuestro formato estándar.
        """
        if not anilist_item:
            return {}

        # Unificamos unidades: Episodios para Anime, Capítulos para Manga
        units = anilist_item.get("episodes") or anilist_item.get("chapters")
        
        # Limpieza de descripción (AniList a veces envía <br> o HTML)
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
            "year": anilist_item.get("seasonYear") or "N/A",
            "is_adult": anilist_item.get("isAdult", False)
        }

    @staticmethod
    def list_to_pro_format(anilist_list: list) -> list:
        """Transforma una lista completa de resultados de forma segura"""
        if not anilist_list:
            return []
        return [MediaAdapter.to_pro_format(item) for item in anilist_list if item]