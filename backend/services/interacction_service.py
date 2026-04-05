from fastapi import HTTPException, status
from sqlmodel import Session

# Aquí importarás tus repositorios y el cliente de la API cuando los tengas:
# from backend.repositories.favorite_repository import ...
# from backend.repositories.review_repository import ...
# from backend.services.anilist_client import get_media_batch

# ==========================================
# GESTIÓN DE FAVORITOS / LISTAS (Viendo, Completado, etc.)
# ==========================================

def add_media_to_list(user_id: int, id_api: int, media_type: str, status_media: str, session: Session):
    # 1. Llamar al repo para comprobar si este usuario ya tiene este id_api en su lista.
    # 2. Si ya lo tiene, lanzar HTTPException 400 ("This media is already in your list").
    # 3. Si no lo tiene, llamar al repo para guardarlo.
    # 4. Devolver un mensaje de éxito.
    pass

def update_media_status(user_id: int, favorite_id: int, new_status: str, session: Session):
    # 1. Llamar al repo para actualizar el estado (ej: de "watching" a "completed").
    # 2. Si el repo devuelve False (no se encontró el favorito), lanzar HTTPException 404.
    # 3. Si va bien, devolver un mensaje de éxito.
    pass

def remove_media_from_list(user_id: int, id_api: int, session: Session):
    # 1. Llamar al repo para borrar el registro usando el user_id y el id_api.
    # 2. Si el repo devuelve False, lanzar HTTPException 404 ("Media not found in your list").
    # 3. Devolver un mensaje de éxito.
    pass

async def get_hydrated_list(user_id: int, session: Session):
    # 1. Llamar al repo para obtener todos los favoritos del usuario (solo tendrás IDs y estados locales).
    # 2. Extraer todos los 'id_api' de esa lista y meterlos en un array normal de Python [id1, id2, id3...].
    # 3. (Futuro) Llamar a tu anilist_client pasándole ese array de IDs para que te devuelva portadas, títulos, etc.
    # 4. Mezclar los datos de AniList con tu estado local y devolver la lista final al frontend.
    pass

# ==========================================
# GESTIÓN DE RESEÑAS (REVIEWS)
# ==========================================

def create_review(user_id: int, id_api: int, media_type: str, score: int, content: str, session: Session):
    # 1. Validar la nota: si score < 1 o score > 5 (o 10, según tu escala), lanzar HTTPException 400.
    # 2. Validar texto: si len(content) > 255 (o el límite que le pongas en la BD), lanzar HTTPException 400.
    # 3. Comprobar en el repo si este usuario YA hizo una reseña para este id_api. 
    #    Si es así, lanzar HTTPException 400 ("You already reviewed this media, please edit your existing review").
    # 4. Llamar al repo para crear la review y devolverla.
    pass

def update_review(review_id: int, user_id: int, score: int, content: str, session: Session):
    # 1. Validar la nota y la longitud del texto (igual que en create_review).
    # 2. Llamar al repo para buscar la review por su ID. Si no existe, lanzar HTTPException 404.
    # 3. SEGURIDAD: Comprobar que review.user_id == user_id. Si un usuario intenta editar 
    #    la reseña de otro, lanzar HTTPException 403 ("You can only edit your own reviews").
    # 4. Llamar al repo para guardar los cambios y devolver la review actualizada.
    pass

def delete_review(review_id: int, user_id: int, session: Session):
    # 1. Llamar al repo para buscar la review por su ID. Si no existe, lanzar HTTPException 404.
    # 2. SEGURIDAD: Comprobar que review.user_id == user_id. Si intenta borrar la de otro, lanzar HTTPException 403.
    # 3. Llamar al repo para borrarla y devolver un mensaje de éxito.
    pass