

from sqlmodel import Session, and_, or_, select

from backend.models.friendship import Friendship, FriendshipStatus


def send_friend_request(requester_id:int, receiver_id:int ,session:Session):
    statement = select(Friendship).where(
        or_(
            and_(Friendship.requester_id == requester_id, Friendship.receiver_id == receiver_id),
            and_(Friendship.requester_id == receiver_id, Friendship.receiver_id == requester_id)
        )
    )
    friend_request = session.exec(statement).first()
    if not friend_request:
        new_friend_request=Friendship(requester_id=requester_id,receiver_id=receiver_id)
        session.add(new_friend_request)
        session.commit()
        session.refresh(new_friend_request)
        return True
    else:
        return False

def accept_friend_request(requester_id:int, receiver_id:int, session:Session):
    friend_request = session.get(Friendship, {"requester_id": requester_id, "receiver_id": receiver_id})

    if friend_request and friend_request.status == FriendshipStatus.pending:
        friend_request.status=FriendshipStatus.friends
        session.add(friend_request)
        session.commit()
        session.refresh(friend_request)
        return True
    else:
        return False
    
def remove_friendship(user_id_A:int, user_id_B:int,session:Session):
    statement = select(Friendship).where(
        or_(
            and_(Friendship.requester_id == user_id_A, Friendship.receiver_id == user_id_B),
            and_(Friendship.requester_id == user_id_B, Friendship.receiver_id == user_id_A)
        )
    )
    friendship = session.exec(statement).first()

    if  friendship:
        session.delete(friendship)
        session.commit()
        return True
    else:
     return False   
    
def get_friends(user_id:int,session:Session):
    statement = select(Friendship).where(
        or_(
            Friendship.requester_id == user_id,
            Friendship.receiver_id == user_id
        ),
        Friendship.status == FriendshipStatus.friends 
    )
    
    friends = session.exec(statement).all()
    return friends

def get_pending_requests(user_id:int,session:Session):
    statement=select(Friendship).where(Friendship.receiver_id==user_id,Friendship.status==FriendshipStatus.pending)
    friend_request_pending=session.exec(statement=statement).all()
    
    return friend_request_pending
    
def get_friendship_status(user_id_A:int, user_id_B:int, session:Session):
    statement = select(Friendship).where(
        or_(
            and_(Friendship.requester_id == user_id_A, Friendship.receiver_id == user_id_B),
            and_(Friendship.requester_id == user_id_B, Friendship.receiver_id == user_id_A)
        )
    )
    friendship = session.exec(statement).first()
    if friendship:
        return friendship.status
    else:
        return None