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
    password:str=Field(nullable=False)
    picture:str = Field(default="https://res.cloudinary.com/dlalpfup4/image/upload/v1776712618/default_ysnuey.jpg")
    rol:Rol = Field(default=Rol.user,nullable=False)
    isAdult:bool = Field(default=False,nullable=False)
    reviews :List["Review"]= Relationship(back_populates="user",sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    favorites:List["UserFavorite"]= Relationship(back_populates="user",sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sent_friendships: List["Friendship"] = Relationship(
        back_populates="requester",                 
        sa_relationship_kwargs={
            "primaryjoin": "Users.id == Friendship.requester_id",
             "cascade": "all, delete-orphan"
        }
    )
    received_friendships: List["Friendship"] = Relationship(
        back_populates="receiver",          
        sa_relationship_kwargs={
            "primaryjoin": "Users.id == Friendship.receiver_id",
             "cascade": "all, delete-orphan"
        }
    )