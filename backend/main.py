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

from backend.models.users import Users
from backend.models.review import Review
from backend.models.favorite import Favorite
from backend.models.userfavorite import UserFavorite
from backend.models.friendship import Friendship
from backend.routes import auth_router, content_router, favorite_router, review_router, friend_routes
from backend.tests.self_tests import run_self_tests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    FastAPICache.init(InMemoryBackend())
    await run_self_tests()
    yield


app = FastAPI(title="NakameGate", version="1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
origenes_permitidos = []
for o in os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(","):
    if o.strip():
        origenes_permitidos.append(o.strip().rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# No-store en endpoints por usuario para evitar que un proxy sirva la respuesta de otro.
NO_BROWSER_CACHE_PREFIXES = ("/content/home", "/favorites/stats")

@app.middleware("http")
async def disable_browser_cache_for_user_endpoints(request: Request, call_next):
    response = await call_next(request)
    matches_prefix = False
    for p in NO_BROWSER_CACHE_PREFIXES:
        if request.url.path.startswith(p):
            matches_prefix = True
            break
    if matches_prefix:
        response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(auth_router.router)
app.include_router(content_router.router)
app.include_router(favorite_router.router)
app.include_router(review_router.router)
app.include_router(friend_routes.router)
