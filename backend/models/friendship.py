from datetime import datetime,timezone
from enum import Enum
from typing import TYPE_CHECKING
from sqlmodel import  Field, Relationship,SQLModel

if TYPE_CHECKING:
    from backend.models.users import Users

class FriendshipStatus(str,Enum):
    friends="friends"
    pending="pending" 

class Friendship(SQLModel,table=True):
    requester_id:int=Field(foreign_key="users.id",primary_key=True)
    receiver_id:int= Field(foreign_key="users.id",primary_key=True)
    status:FriendshipStatus=Field(default=FriendshipStatus.pending,nullable=False)
    datefrienship:datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    requester: "Users" = Relationship(
        back_populates="sent_friendships",
        sa_relationship_kwargs={
            "primaryjoin": "Friendship.requester_id == Users.id",
            "foreign_keys": "[Friendship.requester_id]"  
    }
)
    receiver: "Users" = Relationship(
        back_populates="received_friendships",  
        sa_relationship_kwargs={
            "primaryjoin": "Friendship.receiver_id == Users.id",
            "foreign_keys": "[Friendship.receiver_id]"
    }
)