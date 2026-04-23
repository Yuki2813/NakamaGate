import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
import cloudinary

# Importación de modelos y rutas
from backend.models.users import Users
from backend.models.review import Review 
from backend.models.favorite import Favorite
from backend.models.userfavorite import UserFavorite
from backend.models.friendship import Friendship
from backend.routes import auth_router, content_router, favorite_router, review_router, friend_routes

# 1. Cargar variables de entorno
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)

# 2. Configurar Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# 3. Definir el Ciclo de Vida (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- AL ARRANCAR ---
    FastAPICache.init(InMemoryBackend())
    print("✅ Caché en memoria iniciada correctamente (Modo Lifespan)")
    
    yield # Aquí el servidor se queda funcionando
    
    # --- AL APAGAR ---
    # (Si en el futuro necesitas cerrar conexiones, va aquí)

# 4. Crear la aplicación FastAPI INYECTANDO el lifespan desde el principio
app = FastAPI(title="NakameGate", version="1.0", lifespan=lifespan)

# 5. Configurar CORS
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

# 6. Incluir Rutas
app.include_router(auth_router.router)
app.include_router(content_router.router)
app.include_router(favorite_router.router)
app.include_router(review_router.router)
app.include_router(friend_routes.router)