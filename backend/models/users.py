from typing import List

from sqlmodel import Field, Relationship, SQLModel

from enum import Enum

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
    reviews = Relationship(back_populates="user",passive_deletes=True)
    favorites= Relationship(back_populates="user",passive_deletes=True)
