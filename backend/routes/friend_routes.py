from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from backend.database import get_db
from backend.models.users import Users
from backend.security import get_current_user_id
from backend.services.user_service import (
    send_friend_request_service,
    accept_friend_request_service,
    remove_friend,
    get_user_social_data,
    get_user_favorites_protected,
    get_public_friends_list
)

router = APIRouter(prefix="/friends", tags=["Friends"])


@router.post("/request/{receiver_id}")
def send_request_endpoint(
    receiver_id: int, 
    current_user: int = Depends(get_current_user_id), 
    session: Session = Depends(get_db)
):

    return send_friend_request_service(
        requester_id=current_user, 
        receiver_id=receiver_id, 
        session=session
    )


@router.put("/accept/{requester_id}")
def accept_request_endpoint(
    requester_id: int, 
    current_user: int = Depends(get_current_user_id), 
    session: Session = Depends(get_db)
):

    return accept_friend_request_service(
        requester_id=requester_id, 
        current_user_id=current_user, 
        session=session
    )


@router.delete("/remove/{friend_id}")
def remove_friend_endpoint(
    friend_id: int, 
    current_user: int = Depends(get_current_user_id), 
    session: Session = Depends(get_db)
):

    return remove_friend(
        user_id_a=current_user, 
        user_id_b=friend_id, 
        session=session
    )


@router.get("/social-data")
def get_social_data_endpoint(
    current_user: int = Depends(get_current_user_id), 
    session: Session = Depends(get_db)
):

    return get_user_social_data(
        user_id=current_user, 
        session=session
    )


@router.get("/{target_user_id}")
def get_user_friends_endpoint(
    target_user_id: int,
    current_user: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return get_public_friends_list(target_user_id=target_user_id, session=session)


@router.get("/{target_user_id}/favorites")
async def get_protected_favorites_endpoint(
    target_user_id: int, 
    current_user: int = Depends(get_current_user_id), 
    session: Session = Depends(get_db)
):

    return await get_user_favorites_protected(
        current_user_id=current_user, 
        target_user_id=target_user_id, 
        session=session
    )