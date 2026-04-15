from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session
from pydantic import BaseModel, EmailStr, Field
from backend.database import get_db
from backend.security import get_current_user_id
from backend.services.auth_service import get_user_by_id_service, register_user, login_user
from backend.services.user_service import update_alias, update_avatar

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
class UserUpdate(BaseModel):
    alias: Optional[str] = Field(
        default=None, 
        min_length=3, 
        max_length=50, 
        description="El nuevo alias del usuario"
    )
    
    picture: Optional[str] = Field(
        default=None, 
        description="URL de la nueva foto de perfil"
    )

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, session: Session = Depends(get_db)):


    return register_user(
        email=data.email,
        alias=data.alias,
        password=data.password,
        is_adult=data.is_adult,
        session=session
    )

@router.post("/login")
def login(data: UserLogin, session: Session = Depends(get_db)):

    return login_user(
        email=data.email, 
        password=data.password, 
        session=session
    )

# ==========================================
# 3. OBTENER PERFIL DEL USUARIO ACTUAL
# ==========================================
@router.get("/me", summary="Obtener perfil del usuario logueado")
async def get_my_profile(
    user_id: int = Depends(get_current_user_id), 
    session: Session = Depends(get_db)
):
   
    user=get_user_by_id_service(id_user=user_id,session=session)
    return {
        "id":user.id,
        "email":user.email,
        "alias":user.alias,
        "picture":user.picture,
        "is_adult":user.isAdult,
        "rol":user.rol
    }

# ==========================================
# 4. ACTUALIZAR PERFIL (Opcional pero recomendado)
# ==========================================
@router.patch("/me/alias", summary="Actualizar solo el alias")
async def change_alias(
    user_data: UserUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):

    nuevo_alias = update_alias(
        user_id=user_id, 
        new_alias=user_data.alias, 
        session=session
    )
    return nuevo_alias



@router.patch("/me/avatar", summary="Actualizar foto de perfil")
async def change_avatar(
    file: UploadFile = File(...), 
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    result = update_avatar(
        user_id=user_id, 
        file=file, 
        session=session
    )
    return result

# ==========================================
# 5. CERRAR SESIÓN (Logout)
# ==========================================
@router.post("/logout", summary="Cerrar sesión")
async def logout(user_id: int = Depends(get_current_user_id)):
    """
    IMPORTANTE SOBRE JWT:
    Los tokens JWT son "Stateless" (sin estado). El backend no guarda los tokens activos.
    Para hacer "logout" real, es el FRONTEND quien debe borrar el token de su LocalStorage.
    
    Aún así, se suele dejar este endpoint para registrar la actividad, o si en el 
    futuro implementas una "lista negra" (blacklist) de tokens revocados.
    """
    return {"message": "Logout exitoso. Recuerda borrar el token en el frontend."}

@router.get("/users/{target_user_id}", summary="Obtener perfil público de un usuario")
async def get_public_profile(
    target_user_id: int, 
    session: Session = Depends(get_db)
):
    # Usamos tu servicio existente para buscar al usuario
    user = get_user_by_id_service(id_user=target_user_id, session=session)
    
    # Devolvemos SOLO los datos públicos (nunca el email ni si es adulto por privacidad)
    return {
        "id": user.id,
        "alias": user.alias,
        "picture": user.picture
    }