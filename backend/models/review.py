from datetime import datetime, timezone
from enum import Enum
from sqlmodel import Relationship, SQLModel,Field


class MediaType(str,Enum):
    anime="anime"
    manga="manga"


class Review(SQLModel,table=True):
    id:int | None = Field(primary_key=True,default=None)
    id_user:int= Field(primary_key=True,foreign_key="users.id")
    id_api:int=Field(nullable=False)
    media_type:MediaType=Field(nullable=False)
    score:int =Field(gt=0,lt=6,nullable=False)
    content:str= Field(max_length=255,nullable=False)
    created_at:datetime=Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    user = Relationship(back_populates="reviews")