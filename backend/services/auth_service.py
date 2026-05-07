import secrets
import requests

from fastapi import HTTPException

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


def _validate_google_token(google_token: str) -> dict:
    """Valida el ID token de Google contra el endpoint tokeninfo y devuelve el payload."""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    resp = requests.get(
        f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}",
        timeout=10
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired Google token")

    idinfo = resp.json()

    if idinfo.get("aud") != google_client_id:
        raise HTTPException(status_code=401, detail="Token not intended for this application")

    if idinfo.get("email_verified") != "true":
        raise HTTPException(status_code=401, detail="Google account email not verified")

    if not idinfo.get("email"):
        raise HTTPException(status_code=400, detail="Google did not provide a valid email")

    return idinfo


def _build_token_response(user) -> dict:
    """Construye el access_token a partir de un usuario."""
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "alias": user.alias,
        "is_adult": user.isAdult,
        "rol": user.rol
    }
    access_token = create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}


def check_google_user(google_token: str, session: Session):
    """
    Primer paso del login con Google.
    Si el email existe, devuelve un access_token.
    Si no existe, devuelve datos para que el frontend muestre el formulario de onboarding.
    No crea ningún usuario.
    """
    idinfo = _validate_google_token(google_token)
    email = idinfo.get("email")
    name = idinfo.get("name", "")

    user = get_user_by_email(email=email, session=session)

    if user:
        response = _build_token_response(user)
        response["status"] = "existing"
        return response

    return {
        "status": "new",
        "email": email,
        "suggested_alias": name
    }


def complete_google_signup(google_token: str, alias: str, is_adult: bool, accept_terms: bool, session: Session):
    """
    Segundo paso del login con Google: el usuario ha rellenado el onboarding.
    Crea el usuario con los datos elegidos y devuelve el access_token.
    """
    if not accept_terms:
        raise HTTPException(status_code=400, detail="You must accept the terms of service")

    if len(alias) < 3 or len(alias) > 20:
        raise HTTPException(status_code=400, detail="Alias must be between 3 and 20 characters")

    idinfo = _validate_google_token(google_token)
    email = idinfo.get("email")

    if get_user_by_email(email=email, session=session):
        raise HTTPException(status_code=400, detail="This Google account is already registered")

    if check_alias_exist(alias=alias, session=session):
        raise HTTPException(status_code=400, detail="This alias is already taken")

    random_password = secrets.token_urlsafe(32)
    hashed_pw = get_password_hash(random_password)

    user = createUser(
        email=email,
        alias=alias,
        password=hashed_pw,
        is_adult=is_adult,
        session=session
    )

    return _build_token_response(user)