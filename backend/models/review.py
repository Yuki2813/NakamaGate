from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer
from sqlmodel import Relationship, SQLModel,Field


if TYPE_CHECKING:
    from backend.models.users import Users


class MediaType(str,Enum):
    anime="anime"
    manga="manga"


class Review(SQLModel,table=True):
    model_config = {"validate_assignment": True} 
    id:int | None = Field(default=None,sa_column=Column(Integer, primary_key=True, autoincrement=True))
    id_user:int= Field(primary_key=True,foreign_key="users.id")
    id_api:int=Field(nullable=False)
    media_type:MediaType=Field(nullable=False)
    score:int =Field(ge=1, le=5, nullable=False)
    content:str= Field(max_length=255,nullable=False)
    created_at:datetime=Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    user :"Users"= Relationship(back_populates="reviews")