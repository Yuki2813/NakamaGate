import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException, status
from sqlmodel import Session
from backend.repositories.friendship_repository import accept_friend_request, get_friends, get_pending_requests, remove_friendship, send_friend_request
from backend.repositories.user_repository import check_id_exist, delete_user, update_user_alias, update_user_avatar

UPLOAD_DIR = "static/profile_pics"
# Nos aseguramos de que la carpeta exista cuando arranque el servidor
os.makedirs(UPLOAD_DIR, exist_ok=True)
# ==========================================
# GESTIÓN DE PERFIL
# ==========================================

def update_alias(user_id: int, new_alias: str, session: Session):
    if len(new_alias.strip())<4:
        raise HTTPException(status_code=400,detail="Your alias needs more than 3 characters")
    check=update_user_alias(user_id=user_id,new_alias=new_alias,session=session)
    if check:
        return new_alias
    else:
        raise HTTPException(status_code=400,detail="In this moment we can't change your alias try again later")
    

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
    check=delete_user(id=user_id,session=session)
    if check==None:
        raise HTTPException(status_code=404, detail="User doesn't exist")
# ==========================================
# SISTEMA DE AMIGOS
# ==========================================

def send_friend_request_service(requester_id: int, receiver_id: int, session: Session):
    if requester_id==receiver_id:
        raise HTTPException(status_code=400, detail="You can't send a friend request to yourself")
    check=check_id_exist(id=receiver_id,session=session)
    if  not check:
        raise HTTPException(status_code=404, detail="The user you are trying to send the request to doesn't exist")
    check=send_friend_request(receiver_id=receiver_id,requester_id=requester_id,session=session)
    if not check:
        raise HTTPException(status_code=404, detail="You already have a  request with this user")
    else:
        return {"message":"the request has been submitted"}
    # 1. Validar que requester_id != receiver_id (no puedes ser tu propio amigo).
    # 2. Comprobar en el repo si el receiver_id existe. Si no, HTTP 404.
    # 3. Comprobar en el repo de amigos si ya hay una petición o ya son amigos. Si sí, HTTP 400.
    # 4. Crear la petición en el repo con estado "pendiente".
        

def accept_friend_request_service(requester_id: int, current_user_id: int, session: Session):
    if(accept_friend_request(requester_id=requester_id,receiver_id=current_user_id,session=session)):
        return {"message":"All is correct"}
    else:
        raise HTTPException(status_code=404, detail="Something went wrong")

def remove_friend(user_id_a: int, user_id_b: int, session: Session):
    if(remove_friendship(user_id_A=user_id_a,user_id_B=user_id_b,session=session)):
        return {"message":"All is correct"}
    else:
        raise HTTPException(status_code=404, detail="Friendship not found")

def get_user_social_data(user_id: int, session: Session):

    friends=get_friends(user_id=user_id,session=session)

    pending=get_pending_requests(user_id=user_id,session=session)


    return {"friends":friends,"pending":pending}
    # 1. Pedir al repo la lista de amigos confirmados.
    # 2. Pedir al repo la lista de peticiones pendientes (donde user_id sea el receptor).
    # 3. Devolver un diccionario con ambas listas, ej: {"friends": [...], "pending": [...]}