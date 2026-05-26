import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from sqlmodel import Session
from backend.repositories.favorite_repository import delete_user_favorite, get_user_favorites as get_user_favorites_repo
from backend.repositories.friendship_repository import accept_friend_request, get_friends, get_pending_requests, get_sent_pending_requests, remove_friendship, send_friend_request
from backend.repositories.user_repository import check_id_exist, delete_user, get_user_by_id, get_users_by_ids, search_users_repo, update_user_adult, update_user_alias, update_user_avatar
from backend.services.auth_service import create_access_token
from backend.services.content_service import SAFE_GENRES
from backend.services.interacction_service import _fetch_media_in_chunks, get_favorite_list, invalidate_home_cache, invalidate_stats_cache


def update_alias(user_id: int, new_alias: str, session: Session):
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if len(new_alias) < 3 or len(new_alias) > 20:
        raise HTTPException(
            status_code=400,
            detail="The alias must be between 3 and 20 characters."
        )

    if new_alias != user.alias:
        update_success = update_user_alias(user_id=user_id, new_alias=new_alias, session=session)

        if not update_success:
            raise HTTPException(
                status_code=400,
                detail="This alias is already in use. Please try another alias."
            )

    # Reemitimos JWT con el alias nuevo para que el front no tenga que re-loguear.
    updated_user = get_user_by_id(id=user_id, session=session)
    token_data = {
        "sub": updated_user.email,
        "user_id": updated_user.id,
        "alias": updated_user.alias,
        "is_adult": updated_user.isAdult,
        "rol": updated_user.rol
    }
    new_access_token = create_access_token(data=token_data)

    return {
        "message": "Alias updated successfully.",
        "access_token": new_access_token,
        "token_type": "bearer"
    }


def update_avatar(user_id: int, file: UploadFile, session: Session):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")

    try:
        # public_id fijo + overwrite=True: cada avatar reemplaza al anterior en Cloudinary.
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="nakamagate/avatars",
            public_id=f"user_{user_id}",
            overwrite=True,
            resource_type="image"
        )
        ruta_web = upload_result.get("secure_url")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen a Cloudinary: {str(e)}")

    exito = update_user_avatar(user_id=user_id, ruta=ruta_web, session=session)

    if not exito:
        # Rollback: borramos el asset en Cloudinary para no dejar huérfanos.
        cloudinary.uploader.destroy(upload_result.get("public_id"))
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"message": "Your avatar saved correctly", "picture": ruta_web}


def delete_account(user_id: int, session: Session):
    deletion_result = delete_user(id=user_id, session=session)
    if not deletion_result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Account deleted successfully"}


async def update_adult_service(user_id: int, is_adult: bool, session: Session):
    user = get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    preference_changed = user.isAdult != is_adult
    was_adult = user.isAdult

    # Actualizamos el flag primero para que la BD quede consistente aunque la limpieza posterior falle.
    updated = update_user_adult(user_id=user_id, is_adult=is_adult, session=session)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")

    if preference_changed:
        await invalidate_home_cache(user_id)

    # Downgrade adulto->no-adulto: retiramos favoritos con hentai o géneros fuera de SAFE_GENRES.
    removed_count = 0
    if was_adult and not is_adult:
        favorite_tuples = get_user_favorites_repo(id_user=user_id, session=session)

        anime_ids = []
        manga_ids = []
        for _, fav_data in favorite_tuples:
            if fav_data.media_type.value == "anime":
                anime_ids.append(fav_data.id_api)
            else:
                manga_ids.append(fav_data.id_api)

        media_dict = {}
        if anime_ids:
            anime_results = await _fetch_media_in_chunks(anime_ids, "ANIME")
            for item in anime_results:
                media_dict[(item["id"], "anime")] = item
        if manga_ids:
            manga_results = await _fetch_media_in_chunks(manga_ids, "MANGA")
            for item in manga_results:
                media_dict[(item["id"], "manga")] = item

        safe_set = set(SAFE_GENRES)
        for _, fav_data in favorite_tuples:
            media = media_dict.get((fav_data.id_api, fav_data.media_type.value))
            if not media:
                continue
            genres = media.get("genres")
            if genres is None:
                genres = []
            is_adult_content = media.get("is_adult") is True
            if not is_adult_content:
                for g in genres:
                    if g not in safe_set:
                        is_adult_content = True
                        break
            if is_adult_content:
                deleted = delete_user_favorite(
                    id_user=user_id,
                    media=fav_data.media_type,
                    idapi=fav_data.id_api,
                    session=session
                )
                if deleted:
                    removed_count += 1

        if removed_count > 0:
            await invalidate_stats_cache(user_id)

    return {"message": "Content preference updated", "is_adult": is_adult, "removed_favorites": removed_count}


def send_friend_request_service(requester_id: int, receiver_id: int, session: Session):
    if requester_id == receiver_id:
        raise HTTPException(status_code=400, detail="You can't send a friend request to yourself")

    receiver_exists = check_id_exist(id=receiver_id, session=session)
    if not receiver_exists:
        raise HTTPException(status_code=404, detail="The user you are trying to send the request to doesn't exist")

    request_sent = send_friend_request(receiver_id=receiver_id, requester_id=requester_id, session=session)
    if not request_sent:
        raise HTTPException(status_code=404, detail="You already have a request with this user")

    return {"message": "the request has been submitted"}


def accept_friend_request_service(requester_id: int, current_user_id: int, session: Session):
    request_accepted = accept_friend_request(requester_id=requester_id, receiver_id=current_user_id, session=session)

    if request_accepted:
        return {"message": "All is correct"}
    else:
        raise HTTPException(status_code=404, detail="Something went wrong")


def remove_friend(user_id_a: int, user_id_b: int, session: Session):
    friendship_removed = remove_friendship(user_id_A=user_id_a, user_id_B=user_id_b, session=session)

    if friendship_removed:
        return {"message": "All is correct"}
    else:
        raise HTTPException(status_code=404, detail="Friendship not found")


def get_user_social_data(user_id: int, session: Session):
    raw_friends = get_friends(user_id=user_id, session=session)
    raw_pending = get_pending_requests(user_id=user_id, session=session)
    raw_sent = get_sent_pending_requests(user_id=user_id, session=session)

    # En una amistad cualquier extremo puede ser requester; tomamos siempre el ID del otro lado.
    friend_ids_set = set()
    for rel in raw_friends:
        if rel.requester_id == user_id:
            friend_ids_set.add(rel.receiver_id)
        else:
            friend_ids_set.add(rel.requester_id)

    pending_ids_set = set()
    for rel in raw_pending:
        pending_ids_set.add(rel.requester_id)

    sent_ids_set = set()
    for rel in raw_sent:
        sent_ids_set.add(rel.receiver_id)

    # Una sola consulta para todos los usuarios involucrados, evitando N+1.
    all_ids = list(friend_ids_set) + list(pending_ids_set) + list(sent_ids_set)
    users_list = get_users_by_ids(all_ids, session)
    users_map = {}
    for user in users_list:
        users_map[user.id] = user

    formatted_friends = []
    for fid in friend_ids_set:
        if fid in users_map:
            u = users_map[fid]
            formatted_friends.append({"id": u.id, "alias": u.alias, "picture": u.picture})

    formatted_pending = []
    for pid in pending_ids_set:
        if pid in users_map:
            u = users_map[pid]
            formatted_pending.append({"id": u.id, "alias": u.alias, "picture": u.picture})

    formatted_sent = []
    for sid in sent_ids_set:
        if sid in users_map:
            u = users_map[sid]
            formatted_sent.append({"id": u.id, "alias": u.alias, "picture": u.picture})

    return {"friends": formatted_friends, "pending": formatted_pending, "sent_pending": formatted_sent}


async def get_user_favorites(target_user_id: int, session: Session):
    return await get_favorite_list(user_id=target_user_id, session=session)


def get_public_friends_list(target_user_id: int, session: Session):
    raw_friends = get_friends(user_id=target_user_id, session=session)

    friend_ids_set = set()
    for rel in raw_friends:
        if rel.requester_id == target_user_id:
            friend_ids_set.add(rel.receiver_id)
        else:
            friend_ids_set.add(rel.requester_id)

    users_list = get_users_by_ids(list(friend_ids_set), session)
    users_map = {}
    for user in users_list:
        users_map[user.id] = user

    formatted_friends = []
    for fid in friend_ids_set:
        if fid in users_map:
            u = users_map[fid]
            formatted_friends.append({"id": u.id, "alias": u.alias, "picture": u.picture})

    return formatted_friends


def search_users_service(alias: str, current_user_id: int, session: Session):
    if len(alias) < 2 or len(alias) > 50:
        raise HTTPException(status_code=400, detail="El termino de busqueda debe tener entre 2 y 50 caracteres")

    matched_users = search_users_repo(alias=alias, current_user_id=current_user_id, session=session)

    public_profiles = []
    for user in matched_users:
        public_profiles.append({
            "id": user.id,
            "alias": user.alias,
            "picture": user.picture
        })

    return public_profiles
