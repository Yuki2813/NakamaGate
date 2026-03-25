from fastapi import Depends
from sqlmodel import Session, select

from backend.database import get_db
from backend.models.users import Users


def createUser(userdata:Users,session: Session ):
    session.add(userdata)
    session.commit()
    session.refresh(userdata)
    return userdata

def get_user_by_email(email:str,password:str,session: Session):
    
    statement=select(Users).where(email==Users.email,password==Users.password)

    user=session.exec(statement=statement).first()

    return user

def get_user_by_alias(alias:str,session: Session ):
    
    statement=select(Users).where(alias==Users.alias)

    user=session.exec(statement=statement).first()

    return user

def delete_user(id:int,session: Session ):

    user=session.get(Users,id)

    if not user:
        
        print("no se encontro el usuario")
        return
    

    session.delete(user)
    session.commit()
