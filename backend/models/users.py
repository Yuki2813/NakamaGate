from typing import TYPE_CHECKING, List

from sqlmodel import Field, Relationship, SQLModel

from enum import Enum

if TYPE_CHECKING:
    from backend.models.friendship import Friendship
    from backend.models.review import Review
    from backend.models.favorite import UserFavorite

class Rol(str,Enum):
    admin="admin"
    user="user"

class Users(SQLModel,table=True):
    id:int | None = Field(default=None, primary_key=True)
    alias:str = Field(unique=True,nullable=False)
    email:str = Field(unique=True,nullable=False)
    password:str=Field(nullable=True)
    picture:str = Field(default="/static/profile_pics/default.jpg")
    rol:Rol = Field(default=Rol.user,nullable=False)
    reviews = Relationship(back_populates="user",sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    favorites= Relationship(back_populates="user",sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sent_friendships: List[Friendship] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Users.id == Friendship.requester_id",
            "back_populates": "requester"
        }
    )
    received_friendships: List[Friendship] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Users.id == Friendship.receiver_id",
            "back_populates": "receiver"
        }
    )