from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from backend.models.users import Users
from backend.models.review import Review 
from backend.models.favorite import Favorite
from backend.models.userfavorite import UserFavorite
from backend.models.friendship import Friendship
from backend.routes import auth_router, content_router, favorite_router, review_router,friend_routes

app = FastAPI(title="NakameGate", version="1.0")

# Asegúrate de que la carpeta existe antes de montarla
os.makedirs("static/profile_pics", exist_ok=True)

# Esto permite a FastAPI mostrar los archivos de la carpeta "static" en la URL "/static"
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router.router)
app.include_router(content_router.router)
app.include_router(favorite_router.router)
app.include_router(review_router.router)
app.include_router(friend_routes.router)

origenes_permitidos = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
