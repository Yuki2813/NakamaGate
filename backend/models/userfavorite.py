from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from enum import Enum

if TYPE_CHECKING:
    from models.users import Users
    from models.favorite import Favorite

class status_favorite(str,Enum):
    watching="watching"
    completed="completed"
    pending="pending"

class UserFavorite(SQLModel,table=True):
    user_id:int=Field(primary_key=True,foreign_key="users.id")
    favorite_id:int=Field(primary_key=True,foreign_key="favorite.id",ondelete="CASCADE")
    status:status_favorite=Field(default=status_favorite.pending,nullable=False)
    user:"Users"= Relationship(back_populates="favorites")
    favorite:"Favorite"= Relationship(back_populates="user_links")
                         