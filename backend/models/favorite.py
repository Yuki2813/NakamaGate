from typing import TYPE_CHECKING, List

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint
from enum import Enum
if TYPE_CHECKING:
    from backend.models.userfavorite import UserFavorite
class Mediatype(str,Enum):
    anime="anime"
    manga="manga"

class Favorite(SQLModel,table=True):
    id:int | None = Field(primary_key=True,default=None)
    media_type:Mediatype = Field(nullable=False)
    id_api:int= Field(nullable=False)
    user_links: List["UserFavorite"] = Relationship(back_populates="favorite")
    __table_args__ = (UniqueConstraint("id_api", "media_type"),)   
