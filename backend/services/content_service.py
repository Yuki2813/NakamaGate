from fastapi import HTTPException, status
from sqlmodel import Session
import random

from backend.clients import anilist_client
# Necesitarás traer al usuario para saber si es mayor de edad:
# from backend.repositories.user_repository import get_user_by_id 

# ==========================================
# PÁGINA PRINCIPAL (HOME)
# ==========================================

async def get_home_service(user_id: int, session: Session):
    # 1. Llamar al repo de usuarios para obtener los datos del user_id.
    # 2. Leer la propiedad 'isAdult' del usuario (True o False).
    # 3. (Opcional) Elegir un género aleatorio de una lista de Python para la sección de recomendados.
    #    Ejemplo: generos = ["Action", "Romance", "Fantasy"] -> random.choice(generos)
    # 4. Definir géneros excluidos si lo deseas (ej. ["Hentai", "Ecchi"] si isAdult es False).
    # 5. Llamar a: await anilist_client.get_home_data(is_adult=..., random_genre=..., excluded_genres=...)
    # 6. Devolver el diccionario con las 3 listas (top_animes, top_mangas, recommended).
    pass

# ==========================================
# BUSCADOR PREDICTIVO
# ==========================================

async def search_media_service(user_id: int, search_text: str, media_type: str, session: Session):
    # 1. Validar la longitud de búsqueda: si len(search_text) < 3, lanzar HTTPException 400.
    #    (Esto evita que el usuario busque la letra "a" y AniList nos devuelva medio millón de resultados).
    # 2. Llamar al repo de usuarios para obtener al user_id y leer su propiedad 'isAdult'.
    # 3. Llamar a: await anilist_client.search_predictive(search_text=search_text, is_adult=..., media_type=media_type)
    # 4. Si la API devuelve una lista vacía, puedes devolver [] directamente o lanzar un 404.
    # 5. Devolver la lista de resultados adaptados.
    pass

# ==========================================
# FICHA TÉCNICA (DETALLES DEL ANIME/MANGA)
# ==========================================

async def get_media_details_service(media_id: int, user_id: int, session: Session):
    # 1. Llamar a: await anilist_client.get_media_details(media_id=media_id)
    # 2. Si la API devuelve None (no existe ese ID), lanzar HTTPException 404 ("Media not found").
    # 3. (Regla de negocio de Seguridad):
    #    - Comprobar en tu BD si el usuario es isAdult.
    #    - Comprobar en los detalles que devolvió la API si el anime es isAdult (media_details.get("is_adult")).
    #    - Si el anime es +18 PERO tu usuario no lo es, lanzar HTTPException 403 ("You are not allowed to view this content").
    # 4. Devolver los detalles del anime/manga.
    pass

async def get_directory_service(user_id: int, page: int, media_type: str, session: Session, genre: str = None):
    if page < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Page number must be 1 or higher")
        
    # user = get_user_by_id(user_id=user_id, session=session)
    # is_adult = user.isAdult
    is_adult = False # Simulado por ahora
    
    per_page = 20
    
    # Le pasamos el género al cliente (si es None, AniList simplemente lo ignora y devuelve todos)
    directory_data = await anilist_client.get_directory_page(
        page=page, 
        per_page=per_page, 
        media_type=media_type, 
        is_adult=is_adult,
        sort="POPULARITY_DESC",
        genre=genre 
    )
    
    return directory_data