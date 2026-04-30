import secrets

from fastapi import HTTPException
import requests

from sqlmodel import Session
from passlib.context import CryptContext
from backend.repositories.user_repository import check_alias_exist, check_email_exist, createUser, get_user_by_email, get_user_by_id
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

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="The password is too short, try another with more characters")

    if len(password) > 72:
        raise HTTPException(
            status_code=400,
            detail="The password is too long. Maximum 72 characters."
        )

    email_already_exists = check_email_exist(email=email, session=session)
    if email_already_exists:
        raise HTTPException(status_code=400, detail="This email is already in use login or try another email")

    alias_already_exists = check_alias_exist(alias=alias, session=session)
    if alias_already_exists:
        raise HTTPException(status_code=400, detail="The alias is already in use try to use another alias")

    new_user = createUser(
        email=email,
        alias=alias,
        password=get_password_hash(password=password),
        is_adult=is_adult,
        session=session
    )

    created_user_data = {
        "email": new_user.email,
        "alias": new_user.alias,
        "picture": new_user.picture
    }

    return created_user_data

def login_user(email: str, password: str, session: Session):
    user = get_user_by_email(email=email, session=session)

    password_is_valid = user and verify_password(plain_password=password, hashed_password=user.password)
    if not password_is_valid:
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

def get_user_by_id_service(id_user: int, session: Session):
    user = get_user_by_id(id=id_user, session=session)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

def get_user_by_email_service(email: str, session: Session):
    user = get_user_by_email(email=email, session=session)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def process_google_login(google_token: str, session: Session):
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    # 1. Verificar que el token pertenece a esta aplicación
    tokeninfo_response = requests.get(
        f"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={google_token}",
        timeout=10
    )

    if tokeninfo_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token de Google inválido o expirado")

    tokeninfo = tokeninfo_response.json()

    if tokeninfo.get("issued_to") != google_client_id:
        raise HTTPException(status_code=401, detail="Token no pertenece a esta aplicación")

    if not tokeninfo.get("verified_email"):
        raise HTTPException(status_code=401, detail="La cuenta de Google no tiene email verificado")

    # 2. Obtener datos del usuario
    userinfo_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {google_token}"},
        timeout=10
    )

    if userinfo_response.status_code != 200:
        raise HTTPException(status_code=401, detail="No se pudieron obtener los datos del usuario")

    user_info = userinfo_response.json()
    email = user_info.get("email")
    name = user_info.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Google no proporcionó un email válido")

    # 2. TRAMPA 1 CORREGIDA: Usamos el repo directo. Si no existe, devuelve None (no da error).
    user = get_user_by_email(email=email, session=session)

    # 3. Registro Automático
    if not user:
        # Generamos clave segura y la encriptamos
        random_password = secrets.token_urlsafe(32)
        hashed_pw = get_password_hash(random_password)
        
        # TRAMPA 2 CORREGIDA: Usamos 'createUser' directo del repo y lo asignamos a 'user'
        user = createUser(
            email=email,
            alias=name,
            password=hashed_pw,
            is_adult=False,  # <--- NUESTRO MODO SEGURO (Filtro activado por defecto)
            session=session
        )

    # 4. TRAMPA 3 CORREGIDA: Generamos el Token IDÉNTICO al de tu login normal
    token_data = {
        "sub": user.email,         
        "user_id": user.id,        
        "alias": user.alias,       
        "is_adult": user.isAdult,
        "rol": user.rol  
    }

    access_token = create_access_token(data=token_data)

    return {"access_token": access_token, "token_type": "bearer"}