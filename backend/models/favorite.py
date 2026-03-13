from sqlmodel import Field, Relationship, SQLModel
from enum import Enum
class Mediatype(str,Enum):
    anime="anime"
    manga="manga"

class Favorite(SQLModel,table=True):
    id:int | None = Field(primary_key=True,default=None)
    media_type:Mediatype = Field(nullable=False)
    id_api:int= Field(nullable=False)
    users= Relationship(back_populates="favorite")
