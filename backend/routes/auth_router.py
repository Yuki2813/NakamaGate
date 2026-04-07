from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel, EmailStr
from backend.database import get_db
from backend.services.auth_service import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# --- ESQUEMAS PARA VALIDAR LOS DATOS QUE RECIBIMOS ---

class UserRegister(BaseModel):
    email: EmailStr
    alias: str
    password: str
    is_adult: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- ENDPOINTS ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, session: Session = Depends(get_db)):
    """
    Crea un nuevo usuario en la base de datos.
    """
    # Llamamos a tu función de auth_service
    return register_user(
        email=data.email,
        alias=data.alias,
        password=data.password,
        is_adult=data.is_adult,
        session=session
    )

@router.post("/login")
def login(data: UserLogin, session: Session = Depends(get_db)):
    """
    Verifica credenciales y devuelve el Token JWT.
    """
    # Esta función ya devuelve {"access_token": ..., "token_type": "bearer"}
    return login_user(
        email=data.email, 
        password=data.password, 
        session=session
    )