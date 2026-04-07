from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

from backend.routes import auth_router, content_router, favorite_router, review_router

app = FastAPI(title="NakameGate", version="1.0")

# Asegúrate de que la carpeta existe antes de montarla
os.makedirs("static/profile_pics", exist_ok=True)

# Esto permite a FastAPI mostrar los archivos de la carpeta "static" en la URL "/static"
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router.router)
app.include_router(content_router.router)
app.include_router(favorite_router.router)
app.include_router(review_router.router)