from fastapi import HTTPException, status
from fastapi_cache import FastAPICache
from sqlmodel import Session

from backend.clients.anilist_client import anilist_client
from backend.models.favorite import Mediatype
from backend.models.review import MediaType
from backend.models.users import Rol
from backend.repositories.favorite_repository import delete_user_favorite, get_user_favorite_ids, get_user_favorites, get_user_favorites_by_status, get_user_favorites_count, new_favorite, update_status_favorite
from backend.repositories.review_repository import create_review, delete_review, get_review_by_id, get_reviews_by_media, get_reviews_by_user, get_user_review_for_media, update_review
from backend.repositories.user_repository import get_user_by_id


async def _fetch_media_in_chunks(ids: list[int], media_type: str) -> list:
    # AniList rechaza batches > 50 IDs.
    chunk_size = 50
    all_results = []
    for i in range(0, len(ids), chunk_size):
        chunk = ids[i:i + chunk_size]
        results = await anilist_client.get_media_batch(chunk, media_type)
        all_results.extend(results)
    return all_results


# Purga manual de la caché por-usuario tras mutaciones. Silenciamos errores para que un fallo de caché no rompa la mutación.
async def invalidate_stats_cache(user_id: int):
    try:
        backend = FastAPICache.get_backend()
        await backend.clear(key=f"stats:user:{user_id}")
    except Exception:
        pass


async def invalidate_home_cache(user_id: int):
    try:
        backend = FastAPICache.get_backend()
        await backend.clear(key=f"home:user:{user_id}")
    except Exception:
        pass


async def add_media_to_list(user_id: int, id_api: int, media_type: MediaType, session: Session):

    # Validamos contra AniList que id y media_type coinciden con el real.
    info_real = await anilist_client.get_media_details(id_api)

    if not info_real:
        raise HTTPException(
            status_code=404,
            detail=f"This ID {id_api} don't exist."
        )

    tipo_real = info_real["type"].lower()

    if tipo_real != media_type.value:
        raise HTTPException(
            status_code=400,
            detail=f"You are trying save a {tipo_real.upper()} like {media_type.value.upper()}."
        )

    if new_favorite(iduser=user_id, id_fav=id_api, mediatype=media_type, session=session):
        await invalidate_stats_cache(user_id)
        return {"message": "The media is now in your favorites"}
    else:
        raise HTTPException(
            status_code=400,
            detail="You already have this media in your favorites"
        )


def update_media_status(user_id: int, favorite_id: int, new_status: str, session: Session):
    status_updated = update_status_favorite(iduser=user_id, idapi=favorite_id, status=new_status, session=session)

    if status_updated:
        return {"message": "The status was updated successfully"}
    else:
        raise HTTPException(status_code=404, detail="The anime/manga could not be found")


async def remove_media_from_list(user_id: int, id_api: int, media_type: Mediatype, session: Session):
    removal_successful = delete_user_favorite(id_user=user_id, idapi=id_api, session=session, media=media_type)

    if removal_successful:
        await invalidate_stats_cache(user_id)
        return {"message": "The anime/manga was properly removed"}
    else:
        raise HTTPException(status_code=404, detail="At this time, we are unable to remove the manga/anime you requested")


async def get_favorite_list(user_id: int, session: Session):
    favorite_tuples = get_user_favorites(id_user=user_id, session=session)

    if len(favorite_tuples) == 0:
        return []

    # Separamos por tipo porque AniList exige una query distinta para ANIME y MANGA.
    anime_ids = []
    manga_ids = []

    for user_fav, fav_data in favorite_tuples:
        tipo = fav_data.media_type.value
        id_api = fav_data.id_api

        if tipo == "anime":
            anime_ids.append(id_api)
        else:
            manga_ids.append(id_api)

    media_dict = {}

    if len(anime_ids) > 0:
        anime_results = await anilist_client.get_media_batch(anime_ids, "ANIME")
        for a in anime_results:
            media_dict[(a["id"], "anime")] = a

    if len(manga_ids) > 0:
        manga_results = await anilist_client.get_media_batch(manga_ids, "MANGA")
        for m in manga_results:
            media_dict[(m["id"], "manga")] = m

    lista_final = []
    for user_fav, fav_data in favorite_tuples:
        datos_anilist = media_dict.get((fav_data.id_api, fav_data.media_type.value))

        if datos_anilist is not None:
            # Devolvemos fav_data.id (PK interna), el frontend la necesita para update/delete.
            lista_final.append({
                "id": fav_data.id,
                "status": user_fav.status,
                "media": datos_anilist
            })

    return lista_final


async def create_review_service(user_id: int, id_api: int, media_type: MediaType, score: int, content: str, session: Session):

    if score < 1 or score > 5:
        raise HTTPException(status_code=400, detail="The score must be between 1 and 5.")

    if len(content) < 1 or len(content) > 255:
        raise HTTPException(status_code=400, detail="The review content must be between 1 and 255 characters.")

    if get_user_review_for_media(user_id=user_id, id_api=id_api, media_type=media_type, session=session) is not None:
        raise HTTPException(status_code=400, detail="You have already reviewed this media. Please edit your existing review instead.")

    info_real = await anilist_client.get_media_details(id_api)

    if not info_real:
        raise HTTPException(
            status_code=404,
            detail=f"The ID {id_api} does not exist in the AniList database."
        )

    tipo_real = info_real["type"].lower()

    if tipo_real != media_type.value:
        raise HTTPException(
            status_code=400,
            detail=f"Data mismatch: You cannot review an {tipo_real.upper()} as a {media_type.value.upper()}."
        )

    review = create_review(user_id=user_id, id_api=id_api, media_type=media_type, score=score, content=content, session=session)

    return review


def update_review_service(review_id: int, user_id: int, score: int, content: str, session: Session):
    if score < 1 or score > 5:
        raise HTTPException(status_code=400, detail="The score must be between 1 and 5")

    if len(content) < 1 or len(content) > 255:
        raise HTTPException(status_code=400, detail="The review content must be between 1 and 255 characters.")
    review = get_review_by_id(review_id=review_id, session=session)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.id_user != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")

    updated_review = update_review(review_id=review_id, score=score, content=content, session=session)

    return updated_review


def delete_review_service(review_id: int, user_id: int, session: Session):
    review = get_review_by_id(review_id=review_id, session=session)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    user = get_user_by_id(id=user_id, session=session)

    # Admin puede borrar cualquier reseña; el resto solo las suyas.
    is_owner = (review.id_user == user_id)
    is_admin = (user.rol == Rol.admin)

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")

    if delete_review(review_id=review_id, session=session):
        return {"message": "Review deleted correctly"}
    else:
        raise HTTPException(status_code=400, detail="Unable to delete review")


def get_reviews_by_media_service(id_api: int, media_type: MediaType, session: Session):
    results = get_reviews_by_media(id_api=id_api, media_type=media_type, session=session)

    final_reviews = []
    for review, user in results:
        review_data = review.model_dump()
        review_data["user"] = {
            "id": user.id,
            "alias": user.alias,
            "picture": user.picture
        }
        review_data.pop("id_user", None)
        final_reviews.append(review_data)

    return final_reviews


async def get_favorite_list_paginated(user_id: int, session: Session, page: int = 1, limit: int = 20, status: str | None = None):
    offset = (page - 1) * limit
    total = get_user_favorites_count(id_user=user_id, session=session, status=status)
    favorite_tuples = get_user_favorites(id_user=user_id, session=session, offset=offset, limit=limit, status=status)

    if not favorite_tuples:
        return {"items": [], "total": total, "page": page, "has_more": False}

    anime_ids = []
    manga_ids = []
    for _, fav_data in favorite_tuples:
        if fav_data.media_type.value == "anime":
            anime_ids.append(fav_data.id_api)
        else:
            manga_ids.append(fav_data.id_api)

    media_dict = {}
    if anime_ids:
        anime_results = await anilist_client.get_media_batch(anime_ids, "ANIME")
        for a in anime_results:
            media_dict[(a["id"], "anime")] = a
    if manga_ids:
        manga_results = await anilist_client.get_media_batch(manga_ids, "MANGA")
        for m in manga_results:
            media_dict[(m["id"], "manga")] = m

    items = []
    for user_fav, fav_data in favorite_tuples:
        datos = media_dict.get((fav_data.id_api, fav_data.media_type.value))
        if datos:
            items.append({"id": fav_data.id, "status": user_fav.status, "media": datos})

    return {"items": items, "total": total, "page": page, "has_more": (offset + limit) < total}


async def get_user_reviews_service(user_id: int, session: Session):
    reviews = get_reviews_by_user(user_id=user_id, session=session)
    if not reviews:
        return []

    anime_ids = []
    manga_ids = []
    for r in reviews:
        if r.media_type.value == "anime":
            anime_ids.append(r.id_api)
        else:
            manga_ids.append(r.id_api)

    media_dict = {}
    if anime_ids:
        anime_results = await _fetch_media_in_chunks(anime_ids, "ANIME")
        for a in anime_results:
            media_dict[(a["id"], "anime")] = a
    if manga_ids:
        manga_results = await _fetch_media_in_chunks(manga_ids, "MANGA")
        for m in manga_results:
            media_dict[(m["id"], "manga")] = m

    result = []
    for review in reviews:
        media = media_dict.get((review.id_api, review.media_type.value))
        if media:
            result.append({
                "id": review.id,
                "score": review.score,
                "content": review.content,
                "created_at": review.created_at,
                "media": {
                    "id": media["id"],
                    "title": media["title"],
                    "image": media["image"],
                    "type": media["type"],
                }
            })

    return result


def get_review_count_service(user_id: int, session: Session):
    reviews = get_reviews_by_user(user_id=user_id, session=session)
    return {"count": len(reviews)}


def get_favorite_ids_service(user_id: int, session: Session):
    rows = get_user_favorite_ids(id_user=user_id, session=session)
    result = []
    for row in rows:
        result.append({
            "id_api": row.id_api,
            "media_type": row.media_type.value,
            "status": row.status.value
        })
    return result


async def get_watching_favorites_service(user_id: int, session: Session):
    favorite_tuples = get_user_favorites_by_status(id_user=user_id, status="watching", session=session)

    if not favorite_tuples:
        return []

    anime_ids = []
    manga_ids = []
    for user_fav, fav_data in favorite_tuples:
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

    final = []
    for user_fav, fav_data in favorite_tuples:
        media = media_dict.get((fav_data.id_api, fav_data.media_type.value))
        if media:
            final.append({
                "id": fav_data.id,
                "status": user_fav.status,
                "media": media
            })

    return final


async def get_favorite_stats_service(user_id: int, session: Session):
    rows = get_user_favorite_ids(id_user=user_id, session=session)
    if not rows:
        return {
            "top_genres": [],
            "unique_genres_count": 0,
            "has_action": False,
            "has_romance": False,
            "has_mystery": False,
        }

    anime_ids = []
    manga_ids = []
    for row in rows:
        if row.media_type.value == "anime":
            anime_ids.append(row.id_api)
        else:
            manga_ids.append(row.id_api)

    media_list = []
    if anime_ids:
        anime_results = await _fetch_media_in_chunks(anime_ids, "ANIME")
        media_list.extend(anime_results)
    if manga_ids:
        manga_results = await _fetch_media_in_chunks(manga_ids, "MANGA")
        media_list.extend(manga_results)

    genre_counts = {}
    has_action = False
    has_romance = False
    has_mystery = False

    for media in media_list:
        genres = media.get("genres")
        if genres is None:
            genres = []
        for g in genres:
            genre_counts[g] = genre_counts.get(g, 0) + 1
            if g == "Action":
                has_action = True
            elif g == "Romance":
                has_romance = True
            elif g == "Mystery" or g == "Psychological":
                has_mystery = True

    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    top_genres = []
    for name, count in sorted_genres[:5]:
        top_genres.append([name, count])

    return {
        "top_genres": top_genres,
        "unique_genres_count": len(genre_counts),
        "has_action": has_action,
        "has_romance": has_romance,
        "has_mystery": has_mystery,
    }
