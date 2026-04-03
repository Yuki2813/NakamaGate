from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
import jwt
from jwt.exceptions import PyJWTError

# Importamos las funciones y variables que ya creaste
from backend.repositories.user_repository import get_user_by_email
from backend.models.users import Users
from backend.database import get_session # Asumo que tienes una función así para tu base de datos
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Esto le dice a FastAPI dónde está el endpoint de login. 
# Cámbialo si tu ruta de login es diferente (ej: "/auth/login")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(
    token: str = Depends(oauth2_scheme), 
    session: Session = Depends(get_session)
) -> Users:
    
    # Excepción estándar si algo falla con el token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Decodificamos el token con nuestra clave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 2. Extraemos el email (que guardamos en el 'sub')
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except PyJWTError:
        # Si el token expiró o la firma es inválida, entra aquí
        raise credentials_exception
        
    # 3. Buscamos al usuario en la base de datos
    user = get_user_by_email(email=email, session=session)
    if user is None:
        raise credentials_exception
        
    # 4. Devolvemos el modelo de usuario validado
    return user