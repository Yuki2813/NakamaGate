import jwt
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer


security=HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for JWT application")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Extrae el user_id sin lanzar excepciones; para key_builders de fastapi-cache que corren antes de Depends.
def user_id_from_auth_header(auth_header: str | None) -> str:
    if not auth_header or not auth_header.startswith("Bearer "):
        return "anon"
    try:
        payload = jwt.decode(auth_header[7:], SECRET_KEY, algorithms=[ALGORITHM])
        return str(payload.get("user_id", "anon"))
    except Exception:
        return "anon"


def get_current_user_id(credentials = Depends(security)) -> int:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token=credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


        user_id: int = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

        return user_id

    except jwt.PyJWTError:
        raise credentials_exception


def get_current_admin_id(credentials = Depends(security)) -> int:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id: int = payload.get("user_id")
        rol: str = payload.get("rol")

        if user_id is None:
            raise credentials_exception

        if rol != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

        return user_id

    except jwt.PyJWTError:
        raise credentials_exception