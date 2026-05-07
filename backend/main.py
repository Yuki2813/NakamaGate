import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.limiter import limiter
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
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


# 5b. Bloquear caché de navegador en endpoints específicos por usuario.
# El decorador @cache de fastapi-cache añade Cache-Control: max-age=...,
# que provoca que el navegador sirva la misma respuesta para distintos usuarios.
# Este middleware corre DESPUÉS del decorador y sobreescribe el header
# para que la caché viva solo en el servidor.
NO_BROWSER_CACHE_PREFIXES = ("/content/home", "/favorites/stats")

@app.middleware("http")
async def disable_browser_cache_for_user_endpoints(request: Request, call_next):
    response = await call_next(request)
    if any(request.url.path.startswith(p) for p in NO_BROWSER_CACHE_PREFIXES):
        response.headers["Cache-Control"] = "no-store"
    return response


# 6. Incluir Rutas
app.include_router(auth_router.router)
app.include_router(content_router.router)
app.include_router(favorite_router.router)
app.include_router(review_router.router)
app.include_router(friend_routes.router)