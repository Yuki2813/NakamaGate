from fastapi import Depends
from sqlmodel import Session, select

from backend.database import get_db
from backend.models.users import Users


def createUser(userdata:Users,session: Session = Depends(get_db)):
    session.add(userdata)
    session.commit()
    session.refresh(userdata)
    return userdata

def get_user(email:str,password:str,session: Session = Depends(get_db)):
    
    statement=select(Users).where(email==Users.email,password==Users.password)

    user=session.exec(statement=statement).first()

    return user

def delete_user(id:int,session: Session = Depends(get_db)):

    user=session.get(Users,id)

    if not user:
        
        print("no se encontro el usuario")
        return
    

    session.delete(user)
    session.commit()
