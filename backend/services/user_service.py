import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException, status
from sqlmodel import Session
from backend.models.friendship import FriendshipStatus
from backend.repositories.friendship_repository import accept_friend_request, get_friends, get_friendship_status, get_pending_requests, remove_friendship, send_friend_request
from backend.repositories.user_repository import check_alias_exist, check_id_exist, delete_user, get_user_by_id, search_users_repo, update_user_alias, update_user_avatar
from backend.services.auth_service import create_access_token
from backend.services.interacction_service import get_favorite_list

UPLOAD_DIR = "./backend/static/profile_pics"
os.makedirs(UPLOAD_DIR, exist_ok=True)
# ==========================================
# GESTIÓN DE PERFIL
# ==========================================

def update_alias(user_id: int, new_alias: str, session: Session):
    
    # 1. Obtener usuario actual
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 2. Validaciones básicas del negocio
    if len(new_alias) < 3 or len(new_alias) > 20:
        raise HTTPException(
            status_code=400, 
            detail="The alias must be between 3 and 20 characters."
        )

    # 3. DELEGAR EN EL REPOSITORIO (Aquí está la magia limpia)
    # Tu función update_user_alias devuelve True si se actualiza, o False si el alias ya existe
    if new_alias != user.alias:
        update_success = update_user_alias(user_id=user_id, new_alias=new_alias, session=session)
        
        if not update_success:
            raise HTTPException(
                status_code=400, 
                detail="This alias is already in use. Please try another alias."
            )

    # 4. Traemos los datos frescos del usuario para generar el token
    updated_user = get_user_by_id(id=user_id, session=session)

    # 5. GENERAMOS EL NUEVO TOKEN
    token_data = {
        "sub": updated_user.email,         
        "user_id": updated_user.id,        
        "alias": updated_user.alias,  # 👈 Este ya es el nuevo gracias a tu repositorio   
        "is_adult": updated_user.isAdult,
        "rol": updated_user.rol  
    }

    new_access_token = create_access_token(data=token_data)

    # 6. Devolvemos la respuesta
    return {
        "message": "Alias updated successfully.",
        "access_token": new_access_token, 
        "token_type": "bearer"
    }
    

def update_avatar(user_id: int, file: UploadFile, session: Session):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")

    extension = file.filename.split(".")[-1] 

    nuevo_nombre = f"user_{user_id}_{uuid.uuid4().hex}.{extension}"
    
    ruta_fisica = os.path.join(UPLOAD_DIR, nuevo_nombre)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(ruta_fisica, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)


    ruta_web = f"/{UPLOAD_DIR}/{nuevo_nombre}" # Quedará como /static/images/user...jpg


    exito = update_user_avatar(user_id=user_id, ruta=ruta_web, session=session)
    
    if not exito:

        os.remove(ruta_fisica)
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"message":"Your avatar save correctly"}

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
    raw_friends = get_friends(user_id=user_id, session=session)
    raw_pending = get_pending_requests(user_id=user_id, session=session)

    formatted_friends = []
    formatted_pending = []
    
    # NUEVO: Creamos un "set" para recordar qué amigos ya hemos añadido
    processed_friend_ids = set()

    for rel in raw_friends:
        friend_id = rel.receiver_id if rel.requester_id == user_id else rel.requester_id
        
        # NUEVO: Solo lo añadimos si NO está en nuestro set de procesados
        if friend_id not in processed_friend_ids:
            friend_user = get_user_by_id(id=friend_id, session=session)
            if friend_user:
                formatted_friends.append({
                    "id": friend_user.id,
                    "alias": friend_user.alias,
                    "picture": friend_user.picture
                })
            # Lo marcamos como procesado para no volver a añadirlo
            processed_friend_ids.add(friend_id)

    # Las peticiones pendientes se quedan igual
    for rel in raw_pending:
        requester_id = rel.requester_id 
        requester_user = get_user_by_id(id=requester_id, session=session)
        
        if requester_user:
            formatted_pending.append({
                "id": requester_user.id,
                "alias": requester_user.alias,
                "picture": requester_user.picture
            })

    return {"friends": formatted_friends, "pending": formatted_pending}

async def get_user_favorites_protected(current_user_id: int, target_user_id: int, session: Session):
    

    if current_user_id == target_user_id:
        return await get_favorite_list(user_id=target_user_id, session=session)


    estado_amistad = get_friendship_status(user_id_A=current_user_id, user_id_B=target_user_id, session=session)


    if estado_amistad != FriendshipStatus.friends:
        raise HTTPException(
            status_code=403,
            detail="You must be friends with this user to see their list."
        )


    return await get_favorite_list(user_id=target_user_id, session=session)


def search_users_service(alias: str, current_user_id: int, session: Session):

    users = search_users_repo(alias=alias, current_user_id=current_user_id, session=session)
    
    resultado = []
    for user in users:
        item = {"id": user.id, "alias": user.alias, "picture": user.picture}
        resultado.append(item)
    return resultado