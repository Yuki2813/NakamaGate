from datetime import datetime,timezone
from enum import Enum
from sqlmodel import  Field,SQLModel

class FriendshipStatus(str,Enum):
    friends="friends"
    pending="pending" 

class Friendship(SQLModel,table=True):
    requester_id:int=Field(foreign_key="users.id",primary_key=True)
    receiver_id:int= Field(foreign_key="users.id",primary_key=True)
    status:FriendshipStatus=Field(default=FriendshipStatus.pending,nullable=False)
    datefrienship:datetime = Field(default_factory=lambda: datetime.now(timezone.utc))