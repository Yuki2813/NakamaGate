from sqlmodel import Session,select

from backend.models.review import MediaType, Review
from backend.models.users import Users


def create_review(user_id:int , id_api:int, media_type:MediaType, score:int, content:str,session:Session):
    new_review=Review(id_user=user_id,id_api=id_api,media_type=media_type,score=score,content=content)
    session.add(new_review)
    session.commit()
    session.refresh(new_review)

    return new_review

def get_reviews_by_media(id_api:int, media_type:MediaType,session:Session):
    statement = (
        select(Review, Users)
        .join(Users, Review.id_user == Users.id)
        .where(Review.id_api == id_api, Review.media_type == media_type)
        .order_by(Review.id.desc())
    )

    reviews=session.exec(statement=statement).all()

    return reviews

def get_reviews_by_user(user_id:int, session:Session):

    statement=select(Review).where(Review.id_user==user_id)

    reviews_user=session.exec(statement=statement).all()

    return reviews_user

def get_user_review_for_media(user_id:int, id_api:int, media_type:MediaType,session:Session):
    
    statement=select(Review).where(Review.id_user==user_id,Review.id_api==id_api,Review.media_type==media_type)

    review_user=session.exec(statement=statement).first()

    return review_user

def update_review(review_id:int, score:int, content:str,session:Session):
    statement=select(Review).where(Review.id==review_id)
    review_update=session.exec(statement=statement).first()
    if review_update:
        review_update.score=score
        review_update.content=content
        session.add(review_update)
        session.commit()
        session.refresh(review_update)
        return review_update
    else:
        return None

def delete_review(review_id: int, session: Session):
    statement = select(Review).where(Review.id == review_id)
    review_delete = session.exec(statement).first()
    if review_delete:
        session.delete(review_delete)
        session.commit()
        return True
    else:
        return False

def get_review_by_id(review_id: int, session: Session):
    statement = select(Review).where(Review.id == review_id)
    review = session.exec(statement=statement).first()
    return review