import jwt
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer


security=HTTPBearer()

# Usa las mismas variables que tienes en tu auth_service
SECRET_KEY = os.getenv("SECRET_KEY", "TU_CLAVE_SUPER_SECRETA")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user_id(credentials = Depends(security)) -> int:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
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