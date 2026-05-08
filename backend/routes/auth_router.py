from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
import requests
from sqlmodel import Session
from pydantic import BaseModel, EmailStr, Field
from backend.database import get_db
from backend.limiter import limiter
from backend.security import get_current_user_id, get_current_admin_id
from backend.services.auth_service import check_google_user, complete_google_signup, get_user_by_email_service, get_user_by_id_service, register_user, login_user
from backend.services.user_service import delete_account, search_users_service, update_adult_service, update_alias, update_avatar

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

class UserRegister(BaseModel):
    email: EmailStr
    alias: str
    password: str
    is_adult: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    alias: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=50,
        description="El nuevo alias del usuario"
    )

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, data: UserRegister, session: Session = Depends(get_db)):
    return register_user(
        email=data.email,
        alias=data.alias,
        password=data.password,
        is_adult=data.is_adult,
        session=session
    )

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, data: UserLogin, session: Session = Depends(get_db)):
    return login_user(
        email=data.email,
        password=data.password,
        session=session
    )

@router.get("/me", summary="Obtener perfil del usuario logueado")
async def get_my_profile(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    user = get_user_by_id_service(id_user=user_id, session=session)
    return {
        "id": user.id,
        "email": user.email,
        "alias": user.alias,
        "picture": user.picture,
        "is_adult": user.isAdult,
        "rol": user.rol
    }

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

@router.post("/logout", summary="Cerrar sesión")
async def logout(user_id: int = Depends(get_current_user_id)):
    return {"message": "Logout exitoso. Recuerda borrar el token en el frontend."}

@router.delete("/me", summary="Eliminar cuenta de usuario")
async def delete_my_account(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return delete_account(user_id=user_id, session=session)

@router.delete("/users/{target_user_id}", summary="Eliminar cuenta de usuario (solo admin)")
async def admin_delete_account(
    target_user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    session: Session = Depends(get_db)
):
    if target_user_id == admin_id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta desde aquí")
    return delete_account(user_id=target_user_id, session=session)

@router.get("/users/{target_user_id}", summary="Obtener perfil público de un usuario")
async def get_public_profile(
    target_user_id: int,
    current_user: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    user = get_user_by_id_service(id_user=target_user_id, session=session)
    return {
        "id": user.id,
        "alias": user.alias,
        "picture": user.picture
    }

@router.get("/search", summary="Buscar cazadores por alias")
@limiter.limit("30/minute")
async def search_users_endpoint(
    request: Request,
    alias: str,
    current_user: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return search_users_service(
        alias=alias,
        current_user_id=current_user,
        session=session
    )

class UpdateAdultRequest(BaseModel):
    is_adult: bool

@router.patch("/me/adult", summary="Actualizar preferencia de contenido adulto")
async def change_adult_preference(
    data: UpdateAdultRequest,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db)
):
    return await update_adult_service(user_id=user_id, is_adult=data.is_adult, session=session)

class GoogleTokenRequest(BaseModel):
    token: str

class GoogleCompleteRequest(BaseModel):
    google_token: str
    alias: str = Field(..., min_length=3, max_length=20)
    is_adult: bool
    accept_terms: bool

@router.post("/google")
@limiter.limit("10/minute")
async def google_auth(request: Request, data: GoogleTokenRequest, session: Session = Depends(get_db)):
    return check_google_user(google_token=data.token, session=session)

@router.post("/google/complete")
@limiter.limit("5/minute")
async def google_signup_complete(request: Request, data: GoogleCompleteRequest, session: Session = Depends(get_db)):
    return complete_google_signup(
        google_token=data.google_token,
        alias=data.alias,
        is_adult=data.is_adult,
        accept_terms=data.accept_terms,
        session=session
    )
