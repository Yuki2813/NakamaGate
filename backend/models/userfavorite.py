from sqlmodel import Field, Relationship, SQLModel

from enum import Enum

class status_favorite(Enum):
    watching="watching"
    completed="completed"
    pending="pending"

class UserFavorite(SQLModel,table=True):
    user_id:int=Field(primary_key=True,foreign_key="users.id")
    favorite_id_api:int=Field(primary_key=True,foreign_key="favorite.id_api")
    status:status_favorite=Field(default=status_favorite.pending,nullable=False)
    user= Relationship(back_populates="favorites")
    favorite= Relationship(back_populates="users")                            