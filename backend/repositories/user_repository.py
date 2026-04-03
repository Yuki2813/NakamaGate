from sqlmodel import Session, select
from backend.models.users import Users


def createUser(email: str, alias: str, password: str, is_adult: bool,session: Session ):
    new_user=Users(email=email,alias=alias,password=password,isAdult=is_adult)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

def get_user_by_email(email:str,session: Session):
    
    statement=select(Users).where(email==Users.email)

    user=session.exec(statement=statement).first()
    if user:
        return user
    
    return None

def get_user_by_alias(alias:str,session: Session ):
    
    statement=select(Users).where(alias==Users.alias)

    user=session.exec(statement=statement).first()

    return user

def delete_user(id:int,session: Session ):

    user=session.get(Users,id)

    if not user:
        
        return None
    
    session.delete(user)
    session.commit()

    return True
def update_user_alias(user_id:int, new_alias:str, session:Session):
    statement= select(Users).where(Users.alias==new_alias)
    useralias=session.exec(statement=statement).first()

    if not useralias:
        user=session.get(Users,user_id)
        user.alias=new_alias
        session.add(user)
        session.commit()
        session.refresh(user)

        return True
    else:
        return False

def update_user_avatar(user_id:int,ruta:str,session:Session):
    user:Users=session.get(Users,user_id)
    if user:
        user.picture=ruta
        session.add(user)
        session.commit()
        session.refresh(user)
        return True
    else:
        return False

def check_email_exist(email:str,session:Session):
    statement=select(Users).where(Users.email==email)

    user=session.exec(statement=statement).first()

    if user:
        return True
    else:
        return False
    
def check_alias_exist(alias:str,session:Session):
    statement=select(Users).where(Users.alias==alias)

    user=session.exec(statement=statement).first()

    if user:
        return True
    else:
        return False