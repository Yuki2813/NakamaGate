from fastapi import HTTPException, status
from sqlmodel import Session
import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException, status
from sqlmodel import Session
from backend.repositories.user_repository import update_user_avatar

UPLOAD_DIR = "static/profile_pics"
# Nos aseguramos de que la carpeta exista cuando arranque el servidor
os.makedirs(UPLOAD_DIR, exist_ok=True)
# ==========================================
# GESTIÓN DE PERFIL
# ==========================================

def update_alias(user_id: int, new_alias: str, session: Session):
    # 1. Comprobar en el repo si el new_alias ya existe. Si sí, lanzar HTTP 400.
    # 2. Si está libre, llamar al repo para actualizarlo.
    # 3. Devolver True o el usuario actualizado.
    pass

def update_avatar(user_id: int, file: UploadFile, session: Session):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")

    extension = file.filename.split(".")[-1] 

    nuevo_nombre = f"user_{user_id}_{uuid.uuid4().hex}.{extension}"
    
    ruta_fisica = os.path.join(UPLOAD_DIR, nuevo_nombre)

    with open(ruta_fisica, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)


    ruta_web = f"/{UPLOAD_DIR}/{nuevo_nombre}" # Quedará como /static/images/user...jpg


    exito = update_user_avatar(user_id=user_id, ruta=ruta_web, session=session)
    
    if not exito:

        os.remove(ruta_fisica)
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return ruta_web

def delete_account(user_id: int, session: Session):
    # 1. Llamar al repo (delete_user).
    # 2. (Tus configuraciones "cascade" en la BD ya se encargarán de borrar 
    #    sus reviews y amigos automáticamente).
    pass

# ==========================================
# SISTEMA DE AMIGOS
# ==========================================

def send_friend_request(requester_id: int, receiver_id: int, session: Session):
    # 1. Validar que requester_id != receiver_id (no puedes ser tu propio amigo).
    # 2. Comprobar en el repo si el receiver_id existe. Si no, HTTP 404.
    # 3. Comprobar en el repo de amigos si ya hay una petición o ya son amigos. Si sí, HTTP 400.
    # 4. Crear la petición en el repo con estado "pendiente".
    pass

def accept_friend_request(requester_id: int, current_user_id: int, session: Session):
    # Nota: current_user_id es el que está aceptando (receiver_id).
    # 1. Buscar la petición en el repo. Si no existe, HTTP 404.
    # 2. Cambiar el estado de la petición a "aceptada" en el repo.
    pass

def remove_friend(user_id_a: int, user_id_b: int, session: Session):
    # 1. Llamar al repo para borrar el registro de amistad entre ambos.
    pass

def get_user_social_data(user_id: int, session: Session):
    # 1. Pedir al repo la lista de amigos confirmados.
    # 2. Pedir al repo la lista de peticiones pendientes (donde user_id sea el receptor).
    # 3. Devolver un diccionario con ambas listas, ej: {"friends": [...], "pending": [...]}
    pass