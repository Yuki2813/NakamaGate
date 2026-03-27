from sqlmodel import Session, select
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
def update_user_alias(user_id:int, new_alias:str, session:Session):
    statement= select(Users).where(Users.alias==new_alias)
    useralias=session.exec(statement=statement).first()

    if not useralias:
        user=session.get(Users,user_id)
        user.alias=new_alias
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        return {"message":"Alias ya en uso intenta otro"}

def update_user_avatar(user_id:int,ruta:str,session:Session):
    user:Users=session.get(Users,user_id)
    if user:
        user.picture=ruta
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"message":"Avatar cambiado"}
    else:
        return{"message":"Seleccione un usuario valido"}
