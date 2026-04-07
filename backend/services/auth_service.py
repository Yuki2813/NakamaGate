from fastapi import HTTPException

from sqlmodel import Session
from passlib.context import CryptContext
from backend.repositories.user_repository import check_alias_exist, check_email_exist, createUser, get_user_by_email
import os
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for JWT application")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def register_user(email: str, alias: str, password: str, is_adult: bool, session: Session):
    
    if len(password)<8:
        raise  HTTPException(status_code=400, detail="The password is too short, try another with more characters")
    if len(password) > 72:
        raise HTTPException(
            status_code=400, 
            detail="The password is too long. Maximum 72 characters."
        )
    user_check_email=check_email_exist(email=email,session=session)
    if user_check_email :
        raise  HTTPException(status_code=400, detail="This email is already in use login or try another email")
    
    user_check_alias=check_alias_exist(alias=alias,session=session)

    if user_check_alias :
        raise  HTTPException(status_code=400, detail="The alias is already in use try to use another alias")
    
    new_user=createUser(email=email,alias=alias,password=get_password_hash(password=password),is_adult=is_adult,session=session)

    return new_user

def login_user(email: str, password: str, session: Session):
    user=get_user_by_email(email=email,session=session)

    if not user or not verify_password(plain_password=password, hashed_password=user.password):
        raise HTTPException(status_code=401, detail="Wrong email or password")

    token_data = {
        "sub": user.email,         
        "user_id": user.id,        
        "alias": user.alias,       
        "is_adult": user.isAdult,
        "rol":user.rol  
    }

    access_token = create_access_token(data=token_data)

    return {"access_token": access_token, "token_type": "bearer"}